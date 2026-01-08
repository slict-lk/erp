import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';


export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const field = formData.get('field') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and SVG are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File is too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public/uploads');
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename with webp extension
    const prefix = field || 'upload';
    const fileName = `${prefix}-${randomUUID()}.webp`;
    const filePath = join(uploadDir, fileName);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert to WebP and save
    const sharp = require('sharp'); // Dynamic import to avoid build issues if not present yet
    await sharp(buffer)
      .webp({ quality: 80 })
      .toFile(filePath);

    // Return public URL
    const publicUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      field,
      fileName,
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
