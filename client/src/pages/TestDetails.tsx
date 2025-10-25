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

  // Testi delle domande per esercizi 1-7
  const exerciseQuestions = {
    1: {
      context: "Siete in un gruppo e si deve prendere una decisione importante che riguarda tutti. Voi:",
      options: ["Prendete parte attiva alla discussione", "Ascoltate e vi adeguate alla maggioranza", "Preferite non prendere posizione"]
    },
    2: {
      context: "Vi trovate in una situazione di conflitto con un collega. Voi:",
      options: ["Affrontate subito la questione", "Aspettate che si risolva da sola", "Cercate una mediazione"]
    },
    3: {
      context: "Avete ricevuto un incarico importante. Voi:",
      options: ["Lo accettate con entusiasmo", "Valutate attentamente prima di decidere", "Preferite delegare ad altri"]
    },
    4: {
      context: "State organizzando un evento. Voi:",
      options: ["Pianificate tutto nei minimi dettagli", "Lasciate spazio all'improvvisazione", "Delegate l'organizzazione"]
    },
    5: {
      context: "Dovete prendere una decisione importante. Voi:",
      options: ["Decidete rapidamente", "Riflettete a lungo", "Chiedete consiglio"]
    },
    6: {
      context: "Vi propongono un cambiamento significativo. Voi:",
      options: ["Lo accogliete positivamente", "Siete cauti e riflessivi", "Preferite mantenere lo status quo"]
    },
    7: {
      context: "State lavorando in team. Voi:",
      options: ["Assumete un ruolo di leadership", "Collaborate attivamente", "Preferite lavorare da soli"]
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

