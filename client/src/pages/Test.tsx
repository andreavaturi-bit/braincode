import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Brain, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Test questions data
const exercises = [
  {
    number: 1,
    title: "Comportamento in gruppo con estranei",
    description: "Immaginate di trovarvi in un gruppo di persone che vi sono estranee. Come vi sentite? Qual è il comportamento per voi tipico in una situazione del genere?",
    type: "plusminus" as const,
    options: [
      { id: "1", text: "Tra estranei mi sento spesso a disagio, in un primo tempo preferisco restare in disparte." },
      { id: "2", text: "In società mi trovo subito molto bene; anche con estranei stabilisco velocemente buoni contatti." },
      { id: "3", text: "In un gruppo sono spesso quello che ha più «voce in capitolo»; se c'è da prendere l'iniziativa tendo a gestire la situazione." },
    ],
  },
  {
    number: 2,
    title: "Reazione alle contrarietà",
    description: "Qual è la vostra maniera tipica di reagire alle contrarietà sul lavoro o nella vita privata?",
    type: "plusminus" as const,
    options: [
      { id: "4", text: "Quando mi arrabbio mi arrabbio sul serio e tendo a scaricare la tensione anche fisicamente." },
      { id: "5", text: "Se qualcosa mi fa arrabbiare devo sfogarmi, mi piacerebbe parlare e dire tutto quello che mi passa per la mente." },
      { id: "6", text: "Quando sono arrabbiato o agitato cerco di far finta di nulla, devo riuscire a venirne a capo da solo. Preferisco tirarmi in disparte." },
    ],
  },
  {
    number: 3,
    title: "Periodo della vita preferito",
    description: "Quale di questi periodi della vita secondo voi è il più bello?",
    type: "plusminus" as const,
    options: [
      { id: "7", text: "Quello dell'infanzia è un periodo bellissimo, con le sue sicurezze e l'assenza di preoccupazioni. Mi trovo bene tra i bambini, e anch'essi si trovano bene con me." },
      { id: "8", text: "Sarebbe bello se la giovinezza, durante la quale si conquista il mondo, potesse durare il più a lungo possibile, poiché è il periodo in cui tutto si assapora meglio." },
      { id: "9", text: "Con la maturità si acquista maggior distacco dalle cose, quindi si riesce a convivere meglio con se stessi e con il mondo circostante." },
    ],
  },
  {
    number: 4,
    title: "Prima impressione",
    description: "Come credete che gli altri vi vedano?",
    type: "plusminus" as const,
    options: [
      { id: "10", text: "Appaio simpatico e gioviale." },
      { id: "11", text: "Appaio vivace ed impulsivo." },
      { id: "12", text: "Appaio taciturno e riservato." },
    ],
  },
  {
    number: 5,
    title: "Rapporto con il tempo",
    description: "Voi come vi comportate?",
    type: "plusminus" as const,
    options: [
      { id: "13", text: "Spesso perdo la cognizione del tempo, arrivo in ritardo agli appuntamenti e dimentico le scadenze." },
      { id: "14", text: "Mi capita spesso di rispettare le scadenze sul filo del rasoio e di presentarmi agli appuntamenti all'ultimo momento." },
      { id: "15", text: "Mi dispiace arrivare in ritardo ad appuntamenti e scadenze, sicché, per prudenza, arrivo spesso in anticipo." },
    ],
  },
  {
    number: 6,
    title: "Tempo libero",
    description: "Come trascorrete il vostro tempo libero, quando non avete impegni e potete fare ciò che volete?",
    type: "plusminus" as const,
    options: [
      { id: "16", text: "Ciò che preferisco è dedicarmi indisturbato ai miei interessi personali." },
      { id: "17", text: "Mi piace oziare oppure trascorrere il tempo in buona compagnia." },
      { id: "18", text: "Devo sempre intraprendere qualcosa, non posso star fermo senza far nulla." },
    ],
  },
  {
    number: 7,
    title: "Importanza vitale",
    description: "Dite quale, delle tre situazioni di seguito proposte, vi sembra abbia la maggiore importanza.",
    type: "plusminus" as const,
    options: [
      { id: "19", text: "Essere rinchiuso, incatenato o addirittura immobilizzato in spazi angusti mi risulta davvero insopportabile. Per me la libertà di movimento è di vitale importanza." },
      { id: "20", text: "Essere escluso dai contatti con il mondo esterno e abbandonato dalla gente mi risulta davvero insopportabile. Per me i contatti con la gente sono di vitale importanza." },
      { id: "21", text: "Dover stare di continuo tra la gente senza mai potermi isolare mi risulta davvero insopportabile. La mia \"vita privata\" è di vitale importanza." },
    ],
  },
  {
    number: 8,
    title: "Affermazioni (22-27)",
    description: "Scegliere le 3 affermazioni che si adattano di più al proprio comportamento.",
    type: "affirmations" as const,
    options: [
      { id: "22", text: "Affermazione 22 (da completare con i dati dal libro)" },
      { id: "23", text: "Affermazione 23 (da completare con i dati dal libro)" },
      { id: "24", text: "Affermazione 24 (da completare con i dati dal libro)" },
      { id: "25", text: "Affermazione 25 (da completare con i dati dal libro)" },
      { id: "26", text: "Affermazione 26 (da completare con i dati dal libro)" },
      { id: "27", text: "Affermazione 27 (da completare con i dati dal libro)" },
    ],
  },
  {
    number: 9,
    title: "Affermazioni (28-33)",
    description: "Scegliere le 3 affermazioni che si adattano di più al proprio comportamento.",
    type: "affirmations" as const,
    options: [
      { id: "28", text: "Affermazione 28 (da completare con i dati dal libro)" },
      { id: "29", text: "Affermazione 29 (da completare con i dati dal libro)" },
      { id: "30", text: "Affermazione 30 (da completare con i dati dal libro)" },
      { id: "31", text: "Affermazione 31 (da completare con i dati dal libro)" },
      { id: "32", text: "Affermazione 32 (da completare con i dati dal libro)" },
      { id: "33", text: "Affermazione 33 (da completare con i dati dal libro)" },
    ],
  },
  {
    number: 10,
    title: "Affermazioni (34-39)",
    description: "Scegliere le 3 affermazioni che si adattano di più al proprio comportamento.",
    type: "affirmations" as const,
    options: [
      { id: "34", text: "Nella maggior parte delle occasioni preferisco assistere piuttosto che prendere parte attiva." },
      { id: "35", text: "Vado su tutte le furie quando mi tocca aspettare qualcosa o qualcuno." },
      { id: "36", text: "Quando mi sento attaccato ho spesso una reazione forte e aggressiva." },
      { id: "37", text: "Partecipo a tutto volentieri; non voglio fare il guastafeste." },
      { id: "38", text: "Certamente, mi faccio sempre una mia opinione, il più delle volte preferisco però tenerla per me." },
      { id: "39", text: "Quando si tratta di decidere spesso mi adeguo pur di non litigare." },
    ],
  },
];

export default function Test() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [currentExercise, setCurrentExercise] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  
  const submitTest = trpc.test.submit.useMutation({
    onSuccess: (data) => {
      toast.success("Test completato!");
      navigate(`/results/${data.testResultId}`);
    },
    onError: (error) => {
      toast.error("Errore durante il salvataggio del test");
      console.error(error);
    },
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Caricamento...</div>;
  }

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const exercise = exercises[currentExercise];
  const progress = ((currentExercise + 1) / exercises.length) * 100;
  const isLastExercise = currentExercise === exercises.length - 1;
  const currentAnswer = answers[exercise.number];

  const canProceed = () => {
    if (!currentAnswer) return false;
    
    if (exercise.type === "plusminus") {
      const plusCount = Object.values(currentAnswer).filter(v => v === "+").length;
      const minusCount = Object.values(currentAnswer).filter(v => v === "-").length;
      return plusCount === 1 && minusCount === 1;
    } else {
      return currentAnswer.length === 3;
    }
  };

  const handleNext = () => {
    if (canProceed()) {
      if (isLastExercise) {
        handleSubmit();
      } else {
        setCurrentExercise(currentExercise + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentExercise > 0) {
      setCurrentExercise(currentExercise - 1);
    }
  };

  const handleSubmit = () => {
    const formattedAnswers = Object.entries(answers).map(([exerciseNumber, answerData]) => ({
      exerciseNumber: parseInt(exerciseNumber),
      answerData,
    }));

    submitTest.mutate({ answers: formattedAnswers });
  };

  const handlePlusMinusChange = (optionId: string, value: "+" | "-" | "") => {
    const newAnswer = { ...currentAnswer };
    
    // Remove the value from other options if it's being set
    if (value !== "") {
      Object.keys(newAnswer).forEach(key => {
        if (newAnswer[key] === value && key !== optionId) {
          newAnswer[key] = "";
        }
      });
    }
    
    newAnswer[optionId] = value;
    setAnswers({ ...answers, [exercise.number]: newAnswer });
  };

  const handleAffirmationChange = (optionId: string, checked: boolean) => {
    const currentSelected = currentAnswer || [];
    let newSelected;
    
    if (checked) {
      if (currentSelected.length < 3) {
        newSelected = [...currentSelected, optionId];
      } else {
        return; // Already 3 selected
      }
    } else {
      newSelected = currentSelected.filter((id: string) => id !== optionId);
    }
    
    setAnswers({ ...answers, [exercise.number]: newSelected });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[oklch(0.65_0.25_145)] via-[oklch(0.65_0.20_25)] to-[oklch(0.65_0.25_264)] flex items-center justify-center">
                <Brain className="w-6 h-6 text-black" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-[oklch(0.65_0.25_145)] via-[oklch(0.65_0.20_25)] to-[oklch(0.65_0.25_264)] bg-clip-text text-transparent">
                BrainCode
              </h1>
            </div>
          </Link>
          <div className="text-sm text-muted-foreground">
            Esercizio {currentExercise + 1} di {exercises.length}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-sm border-b border-border/40">
        <div className="container py-4">
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <main className="container flex-1 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <Card className="border-accent/30">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {exercise.number}
                </div>
                <CardTitle className="text-2xl">{exercise.title}</CardTitle>
              </div>
              <CardDescription className="text-base leading-relaxed">
                {exercise.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {exercise.type === "plusminus" ? (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-4 p-4 bg-accent/20 rounded-lg">
                    <p className="font-medium mb-2">Istruzioni:</p>
                    <p>• Seleziona <span className="text-[oklch(0.65_0.25_145)] font-bold">+</span> per l'affermazione che si avvicina di più al tuo comportamento</p>
                    <p>• Seleziona <span className="text-[oklch(0.65_0.20_25)] font-bold">-</span> per l'affermazione che si discosta di più dal tuo comportamento</p>
                  </div>

                  {exercise.options.map((option) => (
                    <div key={option.id} className="p-4 rounded-lg border border-border bg-card/50 space-y-3">
                      <p className="text-sm leading-relaxed">{option.text}</p>
                      <div className="flex gap-4">
                        <Button
                          variant={currentAnswer?.[option.id] === "+" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePlusMinusChange(option.id, currentAnswer?.[option.id] === "+" ? "" : "+")}
                          className={currentAnswer?.[option.id] === "+" ? "bg-[oklch(0.65_0.25_145)] hover:bg-[oklch(0.55_0.25_145)]" : ""}
                        >
                          + Più vicino
                        </Button>
                        <Button
                          variant={currentAnswer?.[option.id] === "-" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePlusMinusChange(option.id, currentAnswer?.[option.id] === "-" ? "" : "-")}
                          className={currentAnswer?.[option.id] === "-" ? "bg-[oklch(0.65_0.20_25)] hover:bg-[oklch(0.55_0.20_25)]" : ""}
                        >
                          - Più lontano
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-4 p-4 bg-accent/20 rounded-lg">
                    <p className="font-medium mb-2">Istruzioni:</p>
                    <p>• Seleziona esattamente <span className="text-primary font-bold">3 affermazioni</span> che si adattano di più al tuo comportamento</p>
                    <p className="mt-2">Selezionate: <span className="font-bold">{currentAnswer?.length || 0}/3</span></p>
                  </div>

                  {exercise.options.map((option) => (
                    <div key={option.id} className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card/50">
                      <Checkbox
                        id={option.id}
                        checked={currentAnswer?.includes(option.id) || false}
                        onCheckedChange={(checked) => handleAffirmationChange(option.id, checked as boolean)}
                        disabled={!currentAnswer?.includes(option.id) && currentAnswer?.length >= 3}
                      />
                      <Label htmlFor={option.id} className="text-sm leading-relaxed cursor-pointer flex-1">
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentExercise === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Indietro
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed() || submitTest.isPending}
            >
              {submitTest.isPending ? (
                "Invio in corso..."
              ) : isLastExercise ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Completa Test
                </>
              ) : (
                <>
                  Avanti
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

