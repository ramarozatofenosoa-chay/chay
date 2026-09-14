import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import {
  Send,
  ChevronDown,
  HelpCircle,
  Loader2,
  MessageSquare,
} from "lucide-react";

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    (async () => {
      const items = await base44.entities.Faq.list("order", 50).catch(() => []);
      setFaqs(Array.isArray(items) ? items : []);
      setLoadingFaqs(false);
    })();
  }, []);

  const update = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast({
        title: "Veuillez remplir les champs requis",
        variant: "destructive",
      });
      return;
    }
    setSending(true);
    try {
      await base44.entities.ContactMessage.create({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim() || "Message",
        message: form.message.trim(),
      });
      toast({
        title: "Message envoyé",
        description: "Nous vous répondrons rapidement.",
      });
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
  const labelCls =
    "block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5";

  return (
    <main className="mx-auto max-w-3xl px-4 md:px-8 py-8 md:py-12">
      <header className="mb-8">
        <h1 className="display-fluid">
          <span className="brand-gradient-text">Contact</span>
        </h1>
        <p className="mt-3 text-base md:text-lg text-foreground/60">
          Une question, une prière, une demande ? Écrivez-nous.
        </p>
      </header>

      <section className="rounded-[2rem] border border-border bg-card p-6 md:p-8">
        <div className="flex items-center gap-2 mb-5">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="font-display font-extrabold text-xl">
            Envoyez un message
          </h2>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nom *</label>
              <input
                value={form.name}
                onChange={update("name")}
                className={inputCls}
                placeholder="Votre nom"
              />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={update("email")}
                className={inputCls}
                placeholder="vous@email.com"
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Sujet</label>
            <input
              value={form.subject}
              onChange={update("subject")}
              className={inputCls}
              placeholder="Objet du message"
            />
          </div>
          <div>
            <label className={labelCls}>Message *</label>
            <textarea
              value={form.message}
              onChange={update("message")}
              rows={5}
              className={`${inputCls} resize-none`}
              placeholder="Votre message…"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 font-bold glow-primary hover:scale-105 transition disabled:opacity-60"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {sending ? "Envoi…" : "Envoyer"}
          </button>
        </form>
      </section>

      <section className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h2 className="font-display font-extrabold text-xl">
            Questions fréquentes
          </h2>
        </div>
        {loadingFaqs ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
          </div>
        ) : faqs.length === 0 ? (
          <p className="text-foreground/50 text-sm">
            Aucune question pour le moment.
          </p>
        ) : (
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div
                key={f.id}
                className="rounded-2xl border border-border bg-card overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left font-bold"
                >
                  {f.question}
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-foreground/70 leading-relaxed">
                    {f.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}