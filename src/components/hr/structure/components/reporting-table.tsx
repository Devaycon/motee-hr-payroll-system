"use client";

import { Pencil, MoreHorizontal, UserRound } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { cn } from "@/src/lib/utils";
import { STATUS_STYLES, STATUS_LABELS } from "../data";
import type { HierarchyNode } from "../types";

interface ReportingTableProps {
  nodes: HierarchyNode[];
  onEdit: (node: HierarchyNode) => void;
}

export function ReportingTable({ nodes, onEdit }: ReportingTableProps) {
  if (nodes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
            <UserRound className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No employees found
          </p>
          <p className="text-xs text-muted-foreground">
            Try adjusting your search or department filter.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Employee
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Job Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Reports To
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">
                  Level
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">
                  Direct Reports
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node) => (
                <tr
                  key={node.id}
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-7 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                          {node.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-foreground">
                        {node.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">
                      {node.department}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-foreground">
                      {node.jobTitle}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {node.managerName ? (
                      <span className="text-xs text-foreground">
                        {node.managerName}
                      </span>
                    ) : (
                      <span className="text-xs italic text-muted-foreground">
                        Top level
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-xs font-mono px-2">
                      L{node.level}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {node.directReports > 0 ? (
                      <span className="text-xs font-medium text-foreground">
                        {node.directReports}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs capitalize",
                        STATUS_STYLES[node.status],
                      )}
                    >
                      {STATUS_LABELS[node.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground"
                        >
                          <MoreHorizontal className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          className="text-xs gap-2"
                          onClick={() => onEdit(node)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Change Manager
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
