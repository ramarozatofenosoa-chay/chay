import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Mail,
  Flag,
  MessageSquare,
} from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export default function HelpSection() {
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    base44.entities.Faq
      .list("-order", 20)
      .then((r) => setFaqs(Array.isArray(r) ? r : []))
      .catch(() => {});
  }, []);

  const links = [
    { to: "/contact", label: "Contacter l'Église", icon: Mail },
    { to: "/contact", label: "Signaler un problème", icon: Flag },
    { to: "/contact", label: "Signaler un contenu", icon: Flag },
    { to: "/contact", label: "Envoyer un retour", icon: MessageSquare },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground/70">
        Besoin d'aide ? Nous sommes là pour vous accompagner.
      </p>

      {faqs.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-foreground/50 mb-1">
            FAQ
          </p>
          <Accordion type="single" collapsible defaultValue="">
            {faqs.map((f) => (
              <AccordionItem
                key={f.id}
                value={f.id}
                className="border border-border rounded-xl px-3 mb-2 bg-card"
              >
                <AccordionTrigger className="hover:no-underline text-sm font-semibold">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent className="text-foreground/70">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      <div className="space-y-1">
        {links.map((l) => {
          const I = l.icon;
          return (
            <Link
              key={l.label}
              to={l.to}
              className="flex items-center gap-2 py-2 text-sm font-semibold hover:text-primary"
            >
              <I className="h-4 w-4" /> {l.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}