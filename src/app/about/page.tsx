import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "About Us — GUESS MY ANYTHING",
  description: "Learn about Guess My Anything, an AI-powered guessing game.",
};

export default function AboutPage() {
  return (
    <LegalPage title="About Us">
      <p>
        <strong>Guess My Anything</strong> is an AI-powered guessing game that uses
        life-stage heuristics and massive datasets to read your mind across Jobs,
        Countries, Animals, Sports, and Age.
      </p>
      <p>
        Inspired by classic games like Akinator and 20 Questions, our engine uses
        a weighted-scoring algorithm with dynamic question selection based on
        information gain. Every answer narrows the field of candidates, and the
        engine adapts in real-time to your responses.
      </p>
      <p>
        Our Age Guesser uses a unique life-stage estimation engine — instead of
        asking blunt numeric questions like &quot;Are you over 50?&quot;, it asks about
        cultural memories, career milestones, and life events to naturally narrow
        down your age.
      </p>
      <p>
        We are committed to providing a fun, engaging, and privacy-respecting
        experience for all users. No accounts required, no personal data collected.
      </p>
    </LegalPage>
  );
}
