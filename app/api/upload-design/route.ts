import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { readFileSync } from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { isValidDesignFile, isValidFileSize } from '@/lib/utils';
import { rateLimit } from '@/lib/rate-limit';
import { logError } from '@/lib/logger';
import { handleCorsPreflight, addCorsHeaders } from '@/lib/cors';
import {
  createUserError,
  createServerError,
  createAccessDeniedError,
} from '@/lib/error-handler';
import { checkBodySize, BODY_SIZE_LIMITS } from '@/lib/body-size-limit';

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  // Check body size limit before parsing (for FormData, this checks total size)
  const sizeCheck = checkBodySize(request, BODY_SIZE_LIMITS.UPLOAD_DESIGN);
  if (sizeCheck) {
    return addCorsHeaders(request, sizeCheck);
  }

  // Rate limiting - strict for file uploads (large files, prevent abuse)
  const rateLimitResponse = rateLimit(request, 'upload');
  if (rateLimitResponse) {
    return addCorsHeaders(request, rateLimitResponse);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return createUserError('No file provided.', 400, request);
    }

    // Validate file type
    if (!isValidDesignFile(file)) {
      return createUserError(
        'Invalid file type. Please upload PNG, JPG, PDF, or SVG files.',
        400,
        request
      );
    }

    // Validate file size (100MB max for Google Drive)
    if (!isValidFileSize(file, 100)) {
      return createUserError(
        'File size too large. Maximum size is 100MB.',
        400,
        request
      );
    }

    // Load Google Drive service account
    const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || path.join(process.cwd(), 'config', 'google-service-account.json');
    
    let serviceAccount;
    try {
      const serviceAccountContent = readFileSync(serviceAccountPath, 'utf8');
      serviceAccount = JSON.parse(serviceAccountContent);
      
      // Validate required fields
      if (!serviceAccount.client_email || !serviceAccount.private_key) {
        return createServerError(request, new Error('Service account missing required fields'));
      }
    } catch (error: any) {
      return createServerError(request, error);
    }

    // Authenticate with Google Drive
    const auth = new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    // Get access token
    await auth.authorize();

    const drive = google.drive({ version: 'v3', auth });

    // Get folder ID from environment
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();

    // Verify folder access if folder ID is provided
    if (folderId) {
      try {
        await drive.files.get({
          fileId: folderId,
          fields: 'id, name',
          supportsAllDrives: true,
        });
      } catch (folderError: any) {
        return createAccessDeniedError(request);
      }
    } else {
      return createServerError(request, new Error('GOOGLE_DRIVE_FOLDER_ID not configured'));
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `lanyard-design-${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Convert file to buffer, then to stream
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Convert buffer to stream (Google Drive API requires a stream)
    const stream = Readable.from(buffer);

    // Upload to Google Drive
    // IMPORTANT: The folder must belong to a regular Google account (not service account)
    // and be shared with the service account email with Editor permissions
    const fileMetadata = {
      name: fileName,
      parents: [folderId], // Always include parent folder
    };

    const media = {
      mimeType: file.type,
      body: stream,
    };

    const uploadResponse = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink',
      supportsAllDrives: true, // Support shared drives
    });

    if (!uploadResponse.data.id) {
      return createServerError(request, new Error('Google Drive upload failed - no file ID returned'));
    }

    // Make file publicly accessible
    await drive.permissions.create({
      fileId: uploadResponse.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Generate direct download URL
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${uploadResponse.data.id}`;

    const response = NextResponse.json({
      success: true,
      data: {
        file_url: downloadUrl,
        file_name: fileName,
        file_id: uploadResponse.data.id,
      },
    });

    return addCorsHeaders(request, response);
  } catch (error) {
    return createServerError(request, error);
  }
}


