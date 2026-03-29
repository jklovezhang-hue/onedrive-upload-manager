import FolderGrid from './FolderGrid';
import QuickNote from './QuickNote';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <FolderGrid />
      <QuickNote />
    </div>
  );
}
