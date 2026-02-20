import Link from 'next/link';
import { Button } from '../ui/button';

interface UserNavClientProps {
  user?: {
    email: string;
    user_metadata: {
      full_name: string;
      avatar_url: string;
    };
  };
}

export function UserNavClient({ user }: UserNavClientProps) {
  if (!user) {
    return (
      <>
        <Link href="/auth">
          <Button 
            className="mr-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-900 text-gray-900 dark:text-white font-semibold"
          >
            Login
          </Button>
        </Link>
        <Link href="/auth?tab=register">
          <Button 
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
          >
            Register
          </Button>
        </Link>
      </>
    );
  }

  return (
    <div>
      <span>{user.email}</span>
    </div>
  );
}
