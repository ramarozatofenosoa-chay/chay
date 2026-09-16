import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({ leftIcon: LeftIcon, className = "", ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      {LeftIcon && (
        <LeftIcon
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
      )}
      <Input
        type={show ? "text" : "password"}
        className={`${LeftIcon ? "pl-10 " : ""}pr-10 ${className}`}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}