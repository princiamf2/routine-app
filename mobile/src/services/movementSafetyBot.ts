export type SafetyLevel = "green" | "yellow" | "red";
export type SafetyResult = {
    level: SafetyLevel;
    title: string;
    message: string;
    shouldShowTherapists: boolean;
};
export function analyzeMovementMessage(userMessage: string): SafetyResult {
    const message = userMessage.toLowerCase();

    if (
        message.includes("je n'arrive plus à marcher") ||
        message.includes("je n'arrive plus a marcher") ||
        message.includes("je n'arrive plus à prendre appui") ||
        message.includes("je n'arrive plus a prendre appui") ||
        message.includes("douleur très forte") ||
        message.includes("douleur brutale") ||
        message.includes("perdu le contrôle") ||
        message.includes("perdu le controle") ||
        message.includes("faible") ||
        message.includes("mal à la tête") ||
        message.includes("mal a la tete") ||
        message.includes("bizarre après") ||
        message.includes("bizarre apres") ||
        message.includes("douleur descend dans les jambes") ||
        message.includes("chirurgie")
    ) {
        return {
            level: "red",
            title: "Avis professionnel recommandé",
            message: "Par prudence, il vaut mieux arrêter l'exercice pour aujourd'hui et demander un avis professionnel. Je ne peux pas poser de diagnostic, mais ce type de signe mérite d'être vérifié.",
            shouldShowTherapists: true,
        };
    }
    if (
        message.includes("douleur") ||
        message.includes("gêne") ||
        message.includes("gene") ||
        message.includes("bloqué") || 
        message.includes("bloque") ||
        message.includes("crispation") ||
        message.includes("peur") ||
        message.includes("raide")
    ) {
        return {
            level: "yellow",
            title: "Adapter l'exercice",
            message: "Tu peux réduire l'intensité, ralentir le movement ou choisir une version plus confortable. Si la sensation augmente, persiste ou t'inquiète, demande un avis professionel.",
            shouldShowTherapists: false,
        };
    }

    return {
        level: "green",
        title: "Continuer progressivement",
        message: "Cettte sensation peut être compatible avec un effort normal. Continue doucement, reste dans une intensité confortable et écoute ton corps.",
        shouldShowTherapists: false,
    };
}