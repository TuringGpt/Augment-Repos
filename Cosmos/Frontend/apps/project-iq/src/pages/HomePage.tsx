import { Card, Button } from '@project-iq/shared/ui';
import { formatDate } from '@project-iq/shared/utils';

export default function HomePage() {
  const today = new Date();

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Project IQ
        </h1>
        <p className="text-gray-600 mb-4">
          This is an NX monorepo setup for Project IQ frontend with shared libraries and
          applications.
        </p>
        <p className="text-sm text-gray-500">Today: {formatDate(today)}</p>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Features</h2>
        <ul className="space-y-2 text-gray-700">
          <li>✅ NX Monorepo Configuration</li>
          <li>✅ Shared UI Component Library</li>
          <li>✅ Shared Utilities and Hooks</li>
          <li>✅ Shared Types and API Client</li>
          <li>✅ Vite + React + TypeScript</li>
          <li>✅ ESLint + Prettier</li>
        </ul>
      </Card>

      <div className="flex gap-4">
        <Button variant="primary" onClick={() => alert('Primary action!')}>
          Primary Action
        </Button>
        <Button variant="secondary" onClick={() => alert('Secondary action!')}>
          Secondary Action
        </Button>
        <Button variant="outline" onClick={() => alert('Outline action!')}>
          Outline Action
        </Button>
      </div>
    </div>
  );
}
