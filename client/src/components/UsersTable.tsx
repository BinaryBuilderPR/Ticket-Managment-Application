import React from 'react';
import { type UserItem } from '@ticket-desk/core';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, ShieldCheck, UserPlus, Calendar } from 'lucide-react';

export interface UsersTableProps {
  users: UserItem[];
  isLoading: boolean;
  onCreateUserClick?: () => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  isLoading,
  onCreateUserClick,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xl">
        <Table>
          <TableHeader className="bg-secondary/40">
            <TableRow>
              <TableHead className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">
                Name
              </TableHead>
              <TableHead className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">
                Email
              </TableHead>
              <TableHead className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">
                Role
              </TableHead>
              <TableHead className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">
                Created
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="hover:bg-secondary/10">
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Skeleton className="h-5 w-16 rounded-md" />
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <Card className="p-12 text-center space-y-4 border-dashed border-border/80">
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
          <Users className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">No users found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Get started by creating the first support agent user using the button above.
          </p>
        </div>
        {onCreateUserClick && (
          <Button onClick={onCreateUserClick} variant="outline" className="gap-2 text-xs">
            <UserPlus className="w-3.5 h-3.5" />
            Create User
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xl">
      <Table>
        <TableHeader className="bg-secondary/40">
          <TableRow>
            <TableHead className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">
              Name
            </TableHead>
            <TableHead className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">
              Email
            </TableHead>
            <TableHead className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">
              Role
            </TableHead>
            <TableHead className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">
              Created
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id} className="hover:bg-secondary/20 transition-colors">
              <TableCell className="px-6 py-4 font-medium whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground font-semibold text-xs border border-border/80">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-foreground">{u.name}</span>
                </div>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                {u.email}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <Badge
                  variant={u.role === 'ADMIN' ? 'admin' : 'agent'}
                  className="text-[10px] uppercase gap-1"
                >
                  {u.role === 'ADMIN' && <ShieldCheck className="w-3 h-3" />}
                  {u.role}
                </Badge>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                  <span>
                    {new Date(u.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UsersTable;

