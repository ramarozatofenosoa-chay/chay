import React from "react";

export default function MediaSection({ icon: Icon, title, action, children }) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="rounded-xl bg-primary/10 p-2">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
          <h2 className="font-display font-extrabold text-xl md:text-2xl">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}