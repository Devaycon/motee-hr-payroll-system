import { Search, Filter, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  COURSE_CATEGORY_LABELS,
  COURSE_CATEGORY_STYLES,
  DELIVERY_MODE_LABELS,
} from "@/src/data/learning-demo";
import type { CourseCategory } from "@/src/lib/types/learning";
import type { Course } from "./data";

interface LibraryTabProps {
  courses: Course[];
  enrolledCourseIds: Set<string>;
  enrolledCourseId: string | null;
  librarySearch: string;
  libraryCategoryFilter: string;
  setLibrarySearch: (v: string) => void;
  setLibraryCategoryFilter: (v: string) => void;
  onDetails: (c: Course) => void;
  onEnroll: (c: Course) => void;
}

export function LibraryTab({
  courses,
  enrolledCourseIds,
  enrolledCourseId,
  librarySearch,
  libraryCategoryFilter,
  setLibrarySearch,
  setLibraryCategoryFilter,
  onDetails,
  onEnroll,
}: LibraryTabProps) {
  const filtered = courses.filter((c) => {
    if (c.status === "draft") return false;
    const matchSearch =
      librarySearch === "" ||
      c.title.toLowerCase().includes(librarySearch.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(librarySearch.toLowerCase()));
    const matchCat =
      libraryCategoryFilter === "all" || c.category === libraryCategoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search courses, topics, tags..."
            value={librarySearch}
            onChange={(e) => setLibrarySearch(e.target.value)}
          />
        </div>
        <Select
          value={libraryCategoryFilter}
          onValueChange={setLibraryCategoryFilter}
        >
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="w-3.5 h-3.5 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {(
              Object.entries(COURSE_CATEGORY_LABELS) as [
                CourseCategory,
                string,
              ][]
            ).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No courses match your search.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            const justEnrolled = enrolledCourseId === course.id;
            return (
              <Card
                key={course.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <Badge
                        className={`text-xs ${COURSE_CATEGORY_STYLES[course.category]}`}
                      >
                        {COURSE_CATEGORY_LABELS[course.category]}
                      </Badge>
                      <p className="font-semibold text-sm text-foreground leading-snug">
                        {course.title}
                      </p>
                    </div>
                    {isEnrolled && (
                      <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 shrink-0">
                        Enrolled
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {course.description}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {course.durationHours}h
                    </span>
                    <span>•</span>
                    <span>{DELIVERY_MODE_LABELS[course.deliveryMode]}</span>
                    <span>•</span>
                    <span>{course.instructor}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => onDetails(course)}
                    >
                      Details
                    </Button>
                    {!isEnrolled ? (
                      <Button
                        size="sm"
                        className="flex-1 text-white bg-[#4361ee] hover:bg-[#3451d1]"
                        onClick={() => onEnroll(course)}
                      >
                        Enrol
                      </Button>
                    ) : justEnrolled ? (
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 text-white"
                        disabled
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Enrolled!
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled
                      >
                        Enrolled
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
