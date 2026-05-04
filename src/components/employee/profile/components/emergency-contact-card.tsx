"use client";

import { useState } from "react";
import { Pencil, Check, X, Phone, User, Heart } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import { DEMO_MY_PROFILE } from "@/src/data/employee-demo";

export function EmergencyContactCard() {
  const ec = DEMO_MY_PROFILE.emergencyContact;
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({
    name: ec.name,
    relationship: ec.relationship,
    phone: ec.phone,
  });
  const [draft, setDraft] = useState({ ...values });

  const handleSave = () => {
    setValues({ ...draft });
    setEditing(false);
  };

  const rows = [
    { icon: User, label: "Full name", key: "name" as const },
    { icon: Heart, label: "Relationship", key: "relationship" as const },
    { icon: Phone, label: "Phone", key: "phone" as const },
  ];

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center justify-between">
          Emergency Contact
          {!editing ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 text-muted-foreground"
              onClick={() => {
                setDraft({ ...values });
                setEditing(true);
              }}
            >
              <Pencil className="w-3 h-3" /> Edit
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1 text-[#1D9E75]"
                onClick={handleSave}
              >
                <Check className="w-3 h-3" /> Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1 text-muted-foreground"
                onClick={() => setEditing(false)}
              >
                <X className="w-3 h-3" /> Cancel
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="px-5 pb-4 pt-3">
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center gap-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted shrink-0">
                <row.icon className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground">{row.label}</p>
                {editing ? (
                  <Input
                    value={draft[row.key]}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        [row.key]: e.target.value,
                      }))
                    }
                    className="h-6 text-xs px-2 mt-0.5"
                  />
                ) : (
                  <p className="text-xs text-foreground font-medium">
                    {values[row.key]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
