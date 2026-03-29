import { Link } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  id?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm">
      <Link
        to="/"
        className="flex items-center gap-1 text-base-content/60 hover:text-primary transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>主页</span>
      </Link>

      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          <ChevronRight className="w-4 h-4 text-base-content/30" />
          {item.id ? (
            <span className="text-base-content font-medium">{item.name}</span>
          ) : (
            <span className="text-base-content/60">{item.name}</span>
          )}
        </span>
      ))}
    </nav>
  );
}