import { Card } from '@project-iq/shared/ui';

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">About</h1>
        <p className="text-gray-700 mb-4">
          Project IQ Frontend Monorepo is built with NX to manage multiple frontend applications
          and shared libraries efficiently.
        </p>
        <p className="text-gray-700">
          This structure allows for code sharing, consistent tooling, and better developer
          experience across all frontend projects.
        </p>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tech Stack</h2>
        <div className="grid grid-cols-2 gap-4 text-gray-700">
          <div>
            <h3 className="font-semibold mb-2">Build Tools</h3>
            <ul className="space-y-1">
              <li>• NX</li>
              <li>• Vite</li>
              <li>• TypeScript</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Frontend</h3>
            <ul className="space-y-1">
              <li>• React 18</li>
              <li>• React Router</li>
              <li>• Tailwind CSS</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
