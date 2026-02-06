/**
 * Demo Context & Provider
 * Manages the state for the Alro Board Demo guided tour.
 * Provides step navigation, talking points, and auto-routing.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const DemoContext = createContext(null);

export const DEMO_STEPS = [
  {
    id: 'intro',
    phase: 'Opening',
    title: 'Welcome — The Operating Brain of Alro',
    route: '/ops-cockpit',
    duration: '60 sec',
    talkingPoints: [
      'This is the SteelWise Ops Cockpit — the unified command center for every service center in your network.',
      'Every number you see is live. Every workflow connects. Nothing falls through the cracks.',
      'Let me walk you through a complete order lifecycle — from the moment a customer sends an RFQ to the moment the truck delivers.',
    ],
    highlight: 'This is not a dashboard. This is your operating brain.',
  },
  {
    id: 'rfq-intake',
    phase: 'Step 1',
    title: 'RFQ Intake & AI Normalization',
    route: '/sales/rfq-inbox',
    duration: '2 min',
    talkingPoints: [
      'A customer emails: "50 pcs 4140 HT 2-inch round bar 12ft." Look how the AI parses that into a structured spec automatically.',
      'Grade 4140, Shape Round Bar, Diameter 2.000", Length 144", Condition Heat Treated, Qty 50 — all normalized in seconds.',
      'Your sales reps spend 40% of their time just interpreting what the customer wants. This does it in seconds and eliminates misquotes.',
    ],
    highlight: 'AI normalization eliminates the #1 source of misquotes.',
  },
  {
    id: 'pricing',
    phase: 'Step 2',
    title: 'Pricing & Margin Preview',
    route: '/pricing',
    duration: '2 min',
    talkingPoints: [
      'The quote is built with live commodity data — LME base, scrap surcharge, processing cost from actual saw time and labor rates.',
      'See the margin indicator: green means above target, yellow is at threshold, red is below. No guesswork.',
      'Customer-specific tier pricing applies automatically. Maria sends this quote before her first coffee.',
    ],
    highlight: 'Live commodity pricing. Real processing costs. Automatic margin protection.',
  },
  {
    id: 'scheduling',
    phase: 'Step 3',
    title: 'Capacity-Aware Promise Date',
    route: '/schedule',
    duration: '2 min',
    talkingPoints: [
      'This is the scheduling Gantt. The new order is automatically slotted into available saw windows.',
      'The promise date is not a guess — it is backed by real machine availability across the entire service center.',
      'Drag and drop to reschedule. The system detects conflicts instantly and shows downstream impact.',
    ],
    highlight: 'Promise dates backed by real capacity, not guesswork.',
  },
  {
    id: 'shopfloor',
    phase: 'Step 4',
    title: 'Shop Floor Visibility',
    route: '/shopfloor',
    duration: '3 min',
    talkingPoints: [
      'This is what your operator sees at 6 AM. Their queue is prioritized. They know exactly what to cut, in what order, with what material.',
      'Scan the material barcode. Job verified. Press Start. The entire organization now knows this job is in progress.',
      'When they finish, the status flows back instantly — to the order board, to the customer portal, to the executive cockpit.',
    ],
    highlight: 'Operators see a simple queue. Everyone else sees real-time progress.',
  },
  {
    id: 'quality',
    phase: 'Step 5',
    title: 'Quality & Traceability',
    route: '/production-quality/trace',
    duration: '2 min',
    talkingPoints: [
      'Full heat-to-delivery traceability chain. Every melt source, every quality check, every custody event.',
      'When your aerospace customer asks "show me the chain of custody," you pull it up in three seconds.',
      'One-click certified compliance package. This is what wins contract renewals and survives audits.',
    ],
    highlight: 'Three-second traceability. From melt to delivery.',
  },
  {
    id: 'packaging',
    phase: 'Step 6',
    title: 'Packaging & Drop Tags',
    route: '/drop-tags/queue',
    duration: '2 min',
    talkingPoints: [
      'Every piece of material gets a certified drop tag with QR code, heat/lot info, and customer spec.',
      'Scan the tag, scan the material, confirm the match. No more misshipments. No more wrong MTRs.',
      'The staging board shows exactly which dock, which truck, which load position. Packaging never has to guess.',
    ],
    highlight: 'The tag IS the traceability. No more misshipments.',
  },
  {
    id: 'logistics',
    phase: 'Step 7',
    title: 'Logistics & Freight',
    route: '/freight/planner',
    duration: '2 min',
    talkingPoints: [
      'Multi-carrier freight comparison. Live rates from your contracted carriers, side by side.',
      'Route optimization across multiple stops. Exception inbox catches problems before your customer calls.',
      'You are spending 8-12% of revenue on freight. This platform saves 10-15% of that — $2-3M per year.',
    ],
    highlight: '$2-3M in annual freight savings. Automated rate shopping and exception management.',
  },
  {
    id: 'margin',
    phase: 'Step 8',
    title: 'Margin Actuals vs. Quote',
    route: '/sales/dashboard',
    duration: '2 min',
    talkingPoints: [
      'Here is where the magic happens. Quoted margin versus actual margin — by job, by customer, by product family.',
      'See exactly where margin leaked: material waste, overtime, freight overrun. Not at month-end — right now.',
      'For the first time, you can protect margin across 70 locations in real-time.',
    ],
    highlight: 'Real-time margin visibility. Quoted vs. actual, by every dimension.',
  },
  {
    id: 'executive',
    phase: 'Step 9',
    title: 'Executive Cockpit & Simulation',
    route: '/executive/cockpit',
    duration: '3 min',
    talkingPoints: [
      'This is your war room. KPIs across every service center, every product family, every time horizon.',
      'Run a what-if simulation: "Move 30% of plate processing from Jackson to Detroit." See the impact instantly.',
      'Every decision is logged with rationale. When the board asks why, you show them — not guess.',
    ],
    highlight: 'Strategy by simulation, not spreadsheets.',
  },
  {
    id: 'close',
    phase: 'Close',
    title: 'The Bottom Line',
    route: '/executive/cockpit',
    duration: '60 sec',
    talkingPoints: [
      '$10-17M in annual impact: margin protection, freight savings, scrap reduction, faster quotes.',
      'Every month without this system, quotes are slower, margin leaks invisibly, and institutional knowledge walks out the door.',
      'The system is built. The demo is live. Alro moves first, or waits until a competitor forces the conversation.',
    ],
    highlight: 'The question is not "should we modernize." It is "do we want to control the system that runs our business."',
  },
];

export function DemoProvider({ children }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const navigate = useNavigate();

  const currentStep = useMemo(() => DEMO_STEPS[currentStepIndex], [currentStepIndex]);
  const totalSteps = DEMO_STEPS.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  const startDemo = useCallback(() => {
    setIsActive(true);
    setCurrentStepIndex(0);
    setIsMinimized(false);
    navigate(DEMO_STEPS[0].route);
  }, [navigate]);

  const stopDemo = useCallback(() => {
    setIsActive(false);
    setCurrentStepIndex(0);
    setIsMinimized(false);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      navigate(DEMO_STEPS[nextIndex].route);
    } else {
      stopDemo();
    }
  }, [currentStepIndex, totalSteps, navigate, stopDemo]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      navigate(DEMO_STEPS[prevIndex].route);
    }
  }, [currentStepIndex, navigate]);

  const goToStep = useCallback((index) => {
    if (index >= 0 && index < totalSteps) {
      setCurrentStepIndex(index);
      navigate(DEMO_STEPS[index].route);
    }
  }, [totalSteps, navigate]);

  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  const value = useMemo(() => ({
    isActive,
    isMinimized,
    currentStep,
    currentStepIndex,
    totalSteps,
    progress,
    startDemo,
    stopDemo,
    nextStep,
    prevStep,
    goToStep,
    toggleMinimize,
  }), [isActive, isMinimized, currentStep, currentStepIndex, totalSteps, progress,
       startDemo, stopDemo, nextStep, prevStep, goToStep, toggleMinimize]);

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
