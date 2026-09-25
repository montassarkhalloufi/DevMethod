import { Button } from '@/shared/ui/button';

export function App() {
  return (
    <main className="mx-auto grid min-h-screen max-w-3xl content-center gap-6 px-6 py-12">
      <p className="text-sm tracking-widest text-muted-foreground uppercase">DevMethod · React</p>
      <h1 className="text-4xl font-semibold tracking-tight">Votre application commence ici.</h1>
      <p className="text-lg text-muted-foreground">
        Un socle React 19, TypeScript strict et Tailwind CSS. Ce template n'a encore ni métier ni
        données initialisées.
      </p>
      <Button asChild className="w-fit">
        <a href="#implementation">Voir le contrat de départ</a>
      </Button>
      <section id="implementation" className="mt-8 rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">Une tranche utilisable, puis sa vérification</h2>
        <p className="mt-3 text-muted-foreground">
          Composer dans app, exprimer le métier dans features et garder les primitives dans shared.
          Le service Studio expose /api/data ; aucune opération n'est simulée par ce point de
          départ.
        </p>
      </section>
    </main>
  );
}
