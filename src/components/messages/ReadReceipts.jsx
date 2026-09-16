import React from "react";
import Avatar from "@/components/messages/Avatar";
import { Check, CheckCheck } from "lucide-react";

export default function ReadReceipts({ readers, allRead }) {
  if (!readers.length) {
    return (
      <div className="flex justify-end mt-0.5">
        <Check className="h-3 w-3 text-foreground/40" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-end gap-1 mt-0.5">
      <div className="flex -space-x-1.5">
        {readers.slice(0, 3).map((p) => (
          <Avatar
            key={p.id || p.created_by_id}
            name={p.display_name}
            src={p.avatar_url}
            size={16}
          />
        ))}
      </div>
      <CheckCheck
        className={`h-3 w-3 ${allRead ? "text-primary" : "text-foreground/40"}`}
      />
    </div>
  );
}