import { toast } from "@/hooks/use-toast";

export function initAssessmentProtection() {
  // Disable copy/paste
  const handleCopy = (e: ClipboardEvent) => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      e.preventDefault();
      toast({
        title: "Content Protected",
        description: "This assessment content cannot be copied.",
        variant: "destructive",
      });
    }
  };

  // Disable right-click context menu on protected content
  const handleContextMenu = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target?.closest(".assessment-protected")) {
      e.preventDefault();
      toast({
        title: "Content Protected",
        description: "Right-click is disabled on assessment content.",
        variant: "destructive",
      });
    }
  };

  // Disable keyboard shortcuts (Ctrl+C, Cmd+C, Ctrl+X, Cmd+X, Print Screen)
  const handleKeyDown = (e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

    // Ctrl+C or Cmd+C
    if (ctrlKey && (e.key === "c" || e.key === "C")) {
      e.preventDefault();
      toast({
        title: "Copy Disabled",
        description: "Copying is not allowed on this assessment.",
        variant: "destructive",
      });
    }

    // Ctrl+X or Cmd+X
    if (ctrlKey && (e.key === "x" || e.key === "X")) {
      e.preventDefault();
      toast({
        title: "Cut Disabled",
        description: "Cutting is not allowed on this assessment.",
        variant: "destructive",
      });
    }

    // Print Screen key
    if (e.key === "PrintScreen") {
      e.preventDefault();
      toast({
        title: "Screenshot Blocked",
        description: "Screenshots are not allowed during assessments.",
        variant: "destructive",
      });
    }

    // Shift+PrintScreen (Windows)
    if (e.shiftKey && e.key === "PrintScreen") {
      e.preventDefault();
      toast({
        title: "Screenshot Blocked",
        description: "Screenshots are not allowed during assessments.",
        variant: "destructive",
      });
    }
  };

  // Add event listeners
  document.addEventListener("copy", handleCopy);
  document.addEventListener("contextmenu", handleContextMenu);
  document.addEventListener("keydown", handleKeyDown);

  // Return cleanup function
  return () => {
    document.removeEventListener("copy", handleCopy);
    document.removeEventListener("contextmenu", handleContextMenu);
    document.removeEventListener("keydown", handleKeyDown);
  };
}
