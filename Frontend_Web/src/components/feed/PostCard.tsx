import { Pin, Users, Calendar, MoreVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';

export interface PostData {
  id: string;
  workspaceId: string;
  title: string;
  body: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  author: { id: string; Name: string; avatarUrl?: string | null };
  commentCount?: number;
  _count?: { comments: number };
}

interface PostCardProps {
  post: PostData;
}

export function PostCard({ post }: PostCardProps) {
  const commentCount = post.commentCount ?? post._count?.comments ?? 0;
  const timeAgo = new Date(post.createdAt).toLocaleDateString();

  return (
    <Card className="p-5 hover:shadow-md transition-shadow bg-white">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            {post.isPinned && (
              <Pin className="size-4 text-[#003366] fill-[#003366]" />
            )}
            <h4 className="flex-1">{post.title}</h4>
            <button className="p-1 hover:bg-muted rounded">
              <MoreVertical className="size-4 text-muted-foreground" />
            </button>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {post.body}
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="size-4" />
              <span>{commentCount} comments</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t border-border">
            <span>By {post.author.Name}</span>
            <span>-</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="size-4" />
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
