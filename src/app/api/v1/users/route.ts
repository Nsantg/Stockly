import { NextRequest } from 'next/server';
import { userController } from '@/controller/UserController';

export const dynamic = 'force-dynamic';

export async function GET() {
  return userController.getUsers();
}

export async function POST(request: NextRequest) {
  return userController.createUser(request);
}
