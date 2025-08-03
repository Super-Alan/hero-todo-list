'use client';

import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const quotes = [
  // 《剑来》经典文案
  "遇事不决，可问春风。春风不语，即随本心。",
  "人生在世，最难开口的事，初次的问好，和最终的道别。",
  "强者不是没有眼泪，而是含着眼泪依然奔跑。",
  "真正的强者，不是没有眼泪的人，而是含着眼泪依然奔跑的人。",
  "世间万般讲理与不讲理，终归会落在一处，我心安处即吾乡。",
  "真正的强者，不是没有眼泪的人，而是含着眼泪依然奔跑的人。",
  "人生不如意之事七八九，能与人言一二三都无，才算坎坷。",
  "修心，亦是修一口心气。",
  "剑修手中剑，可斩天地万物，唯独斩不断心中执念。",
  "大道朝天，各走一边。",
  "人生如棋，落子无悔。",
  "心有所向，日复一日，必有精进。",
  "天地不仁，以万物为刍狗。",
  "修行路上，一步一个脚印。",
  "剑在手，问天下谁是英雄。",
  "心中有剑，万物皆可为剑。",
  "道理全在书上，做人却在书外。",
  "唯竭尽所能之后，你才稍微有点资格去怨天尤人。",
  "修心，亦是修行之一。顺境修力，逆境修心，缺一不可。",
  "酒能红双颊，愁能雪白头。",
  
  // 《哪吒2》经典文案
  "我命由我不由天，是魔是仙，我自己说了算！",
  "若命运不公，就和它斗到底！",
  "人心中的成见就像一座大山，任你怎么努力也休想搬动。",
  "别人的看法都是狗屁，你是谁只有你自己说了算。",
  "天命？我命由我，不由天！",
  "如果命运不公，那就和它战斗到底！",
  "不认命，就是哪吒的命！",
  "我命由我不由天，是魔是仙，我自己决定！",
  "命运掌握在自己手中，不是别人说了算！",
  "真正的英雄，不是没有恐惧，而是战胜恐惧！",
  "相信自己，你就是自己的英雄！",
  "不向命运低头，不向困难屈服！",
  "心中有光，脚下有路！",
  "勇敢面对，无畏前行！",
  "做最好的自己，活出精彩人生！"
];

export default function DailyQuoteDisplay() {
  const [showQuote, setShowQuote] = useState(true);
  const [currentQuote, setCurrentQuote] = useState('');
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const displayText = useTransform(rounded, (latest) => currentQuote.slice(0, latest));
  const [animationCompleted, setAnimationCompleted] = useState(false);

  useEffect(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const quoteIndex = dayOfYear % quotes.length;
    setCurrentQuote(quotes[quoteIndex]);
  }, []);

  useEffect(() => {
    if (!currentQuote) return;

    const baseDuration = 3;
    const maxDuration = 5;
    const charDuration = 0.08; // 稍微加快字符显示速度
    const calculatedDuration = Math.min(
      Math.max(currentQuote.length * charDuration, baseDuration),
      maxDuration
    );

    const controls = animate(count, currentQuote.length, {
      type: "tween",
      duration: calculatedDuration,
      ease: "easeOut",
      onUpdate: (latest) => {
        if (latest === currentQuote.length) {
          setAnimationCompleted(true);
          setTimeout(() => setShowQuote(false), 2500); // 显示完成后停留1.5秒
        }
      },
    });

    return () => controls.stop();
  }, [currentQuote, count]);

  if (!showQuote) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 背景动画效果 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>
      
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-3xl" />
        
        <div className="relative px-8 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <motion.h1 
              className="text-2xl font-light text-cyan-400 tracking-[0.2em]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              每日一句
            </motion.h1>
            
            <div className="relative">
              <motion.p 
                className="text-3xl md:text-4xl lg:text-5xl font-medium text-white leading-relaxed max-w-4xl mx-auto"
                style={{ minHeight: '6rem' }}
              >
                <motion.span className="inline-block">
                  {displayText}
                </motion.span>
                {!animationCompleted && (
                  <motion.span
                    className="inline-block w-1 h-12 bg-cyan-400 ml-1"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                )}
              </motion.p>
            </div>
            
            <motion.div
              className="flex justify-center space-x-2 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-300" />
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse delay-600" />
            </motion.div>
          </motion.div>
        </div>
        
        <div className="absolute inset-0 border border-cyan-500/30 rounded-lg" />
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-lg blur-sm" />
      </div>
    </div>
  );
}
