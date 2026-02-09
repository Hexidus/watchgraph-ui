import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-6 max-w-2xl px-4">
        <h1 className="text-5xl font-bold text-gray-900">
          WatchGraph
        </h1>
        <p className="text-xl text-gray-600">
          Continuous AI Compliance Monitoring
        </p>
        <p className="text-lg text-gray-500">
          Real-time compliance tracking for AI systems under the EU AI Act
        </p>
        
        <div className="flex gap-4 justify-center pt-8">
          <Link href="/login">
            <Button size="lg" className="text-lg px-8">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
