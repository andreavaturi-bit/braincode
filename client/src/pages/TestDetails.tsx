import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function TestDetails() {
  const [, params] = useRoute("/test-details/:testResultId");
  const testResultId = params?.testResultId || "";

  const testResultQuery = trpc.test.getResult.useQuery(
    { testResultId },
    { enabled: !!testResultId }
  );
  
  const testResult = testResultQuery.data;
  const isLoading = testResultQuery.isLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento dettagli...</p>
        </div>
      </div>
    );
  }

  if (!testResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Test non trovato</p>
          <Link href="/dashboard">
            <Button className="mt-4">Torna alla Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Testi delle domande per esercizi 1-7 (dal Google Form)
  const exerciseQuestions = {
    1: {
      context: "Immaginate di trovarvi in un gruppo di persone che vi sono estranee. Come vi sentite? Qual è il comportamento per voi tipico in una situazione del genere?",
      options: [
        "Tra estranei mi sento spesso a disagio, in un primo tempo preferisco restare in disparte.",
        "In società mi trovo subito molto bene; anche con estranei stabilisco velocemente buoni contatti.",
        "In un gruppo sono spesso quello che ha più 'voce in capitolo'; se c'è da prendere l'iniziativa tendo a gestire la situazione."
      ]
    },
    2: {
      context: "Non sempre le cose vanno come si vorrebbe. Talvolta ci si agita o ci si arrabbia. Qual è la vostra maniera tipica di reagire alle contrarietà sul lavoro o nella vita privata?",
      options: [
        "Quando mi arrabbio mi arrabbio sul serio e tendo a scaricare la tensione anche fisicamente.",
        "Se qualcosa mi fa arrabbiare devo sfogarmi, mi piacerebbe parlare e dire tutto quello che mi passa per la mente.",
        "Quando sono arrabbiato o agitato cerco di far finta di nulla, devo riuscire a venirne a capo da solo. Preferisco tirarmi in disparte."
      ]
    },
    3: {
      context: "Gli anni dell'infanzia, quindi quelli della giovinezza e quelli dell'età adulta: tre universi temporali completamente differenti. Quale di questi periodi della vita secondo voi è il più bello?",
      options: [
        "Quello dell'infanzia è un periodo bellissimo, con le sue sicurezze e l'assenza di preoccupazioni. Mi trovo bene tra i bambini, e anch'essi si trovano bene con me.",
        "Sarebbe bello se la giovinezza, durante la quale si conquista il mondo, potesse durare il più a lungo possibile, poiché è il periodo in cui tutto si assapora meglio.",
        "Con la maturità si acquista maggior distacco dalle cose, quindi si riesce a convivere meglio con se stessi e con il mondo circostante."
      ]
    },
    4: {
      context: "Ogni persona è diversa dalle altre per il temperamento e per il modo di comportarsi. Come credete che gli altri vi vedano?",
      options: [
        "Appaio simpatico e gioviale.",
        "Appaio vivace ed impulsivo.",
        "Appaio taciturno e riservato."
      ]
    },
    5: {
      context: "Ogni persona ha il suo modo particolare di rapportarsi al tempo. Voi come vi comportate?",
      options: [
        "Spesso perdo la cognizione del tempo, arrivo in ritardo agli appuntamenti e dimentico le scadenze.",
        "Mi capita spesso di rispettare le scadenze sul filo del rasoio e di presentarmi agli appuntamenti all'ultimo momento.",
        "Mi dispiace arrivare in ritardo ad appuntamenti e scadenze, sicché, per prudenza, arrivo spesso in anticipo."
      ]
    },
    6: {
      context: "Come trascorrete il vostro tempo libero, quando non avete impegni e potete fare ciò che volete?",
      options: [
        "Ciò che preferisco è dedicarmi indisturbato ai miei interessi personali.",
        "Mi piace oziare oppure trascorrere il tempo in buona compagnia.",
        "Devo sempre intraprendere qualcosa, non posso star fermo senza far nulla."
      ]
    },
    7: {
      context: "Dite quale, delle tre situazioni di seguito proposte, vi sembra abbia la maggiore importanza.",
      options: [
        "Essere rinchiuso, incatenato o addirittura immobilizzato in spazi angusti mi risulta davvero insopportabile. Per me la libertà di movimento è di vitale importanza.",
        "Essere escluso dai contatti con il mondo esterno e abbandonato dalla gente mi risulta davvero insopportabile. Per me i contatti con la gente sono di vitale importanza.",
        "Dover stare di continuo tra la gente senza mai potermi isolare mi risulta davvero insopportabile. La mia 'vita privata' è di vitale importanza."
      ]
    },
  };

  // Testi delle affermazioni per esercizi 8-10
  const affirmations: Record<number, string> = {
    22: "Preferisco avere un piano chiaro prima di agire.",
    23: "Mi piace prendere decisioni rapide.",
    24: "Sono una persona riflessiva.",
    25: "Preferisco lavorare in team.",
    26: "Mi piace avere il controllo della situazione.",
    27: "Sono aperto ai cambiamenti.",
    28: "Non amo i contrasti e preferisco evitarli.",
    29: "Sono un tipo risoluto e determinato.",
    30: "Sono estremamente coscienzioso nelle mie azioni.",
    31: "Sovente mi rendo la vita difficile.",
    32: "Mi piace organizzare e pianificare.",
    33: "Devo fare molto movimento per sentirmi bene.",
    34: "Nella maggior parte delle occasioni preferisco assistere piuttosto che prendere parte attiva.",
    35: "Vado su tutte le furie quando mi tocca aspettare qualcosa o qualcuno.",
    36: "Quando mi sento attaccato spesso una reazione forte e aggressiva.",
    37: "Partecipo a tutto volentieri, non voglio fare il guastafeste.",
    38: "Certamente, mi faccio sempre una mia opinione, il più delle volte preferisco però tenerla per me.",
    39: "Quando si tratta di decidere spesso mi adeguo pur di non litigare.",
  };

  const renderAnswer = (exerciseNumber: number, answerData: any) => {
    if (exerciseNumber >= 1 && exerciseNumber <= 7) {
      // Esercizi 1-7: formato {"1": "+", "2": "-"}
      const plusOption = Object.keys(answerData).find(key => answerData[key] === '+');
      const minusOption = Object.keys(answerData).find(key => answerData[key] === '-');
      
      const question = exerciseQuestions[exerciseNumber as keyof typeof exerciseQuestions];
      
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground italic">{question.context}</p>
          <div className="space-y-2">
            {question.options.map((option, idx) => {
              const optionNum = (idx + 1).toString();
              const isPlus = optionNum === plusOption;
              const isMinus = optionNum === minusOption;
              
              return (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    isPlus ? 'bg-green-500/10 border-green-500' : 
                    isMinus ? 'bg-red-500/10 border-red-500' : 
                    'bg-muted/30 border-border'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {(isPlus || isMinus) && <CheckCircle2 className="w-4 h-4" />}
                    <span className="font-medium">{option}</span>
                    {isPlus && <span className="ml-auto text-green-500 font-bold">+</span>}
                    {isMinus && <span className="ml-auto text-red-500 font-bold">-</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    } else if (exerciseNumber >= 8 && exerciseNumber <= 10) {
      // Esercizi 8-10: formato ["28", "30", "33"]
      const selectedAffirmations = Array.isArray(answerData) ? answerData : [];
      
      return (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-3">Affermazioni selezionate:</p>
          {selectedAffirmations.map((affNum: string) => {
            const affirmationText = affirmations[parseInt(affNum)];
            return (
              <div 
                key={affNum}
                className="p-3 rounded-lg bg-green-500/10 border border-green-500"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="font-medium">{affirmationText}</span>
                  <span className="ml-auto text-xs text-muted-foreground">#{affNum}</span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    
    return <p className="text-muted-foreground">Formato risposta non riconosciuto</p>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container flex items-center justify-between h-16">
          <Link href="/dashboard">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Torna Indietro
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dettaglio Risposte</h1>
          <p className="text-muted-foreground">
            Test completato il {new Date(testResult.completedAt).toLocaleDateString('it-IT', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        <div className="space-y-6">
          {testResult.answers.map((answer: any) => (
            <Card key={answer.id}>
              <CardHeader>
                <CardTitle>Esercizio {answer.exerciseNumber}</CardTitle>
                <CardDescription>
                  {answer.exerciseNumber >= 1 && answer.exerciseNumber <= 7 
                    ? "Scegli un'opzione con + e una con -"
                    : "Seleziona le affermazioni che ti rappresentano"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderAnswer(answer.exerciseNumber, answer.answerData)}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

