"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { StatCounter } from "@/components/stat-counter"
import { fadeInVariants, containerVariants, itemVariants } from "@/lib/animations"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border-b border-slate-200"
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-24 h-24 relative">
              <Image
                src="/cherith-logo.png"
                alt="Cherith Training Academy"
                width={96}
                height={96}
                className="object-contain"
              />
            </div>
            <span className="text-lg font-semibold text-slate-900">Cherith Training Academy</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/setup/admin">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600">
                Admin Setup
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6">
            <motion.div variants={itemVariants} className="space-y-2">
              <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide">
                Healthcare Regulation Readiness
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 text-pretty">
                Compliance and Regulatory Standards
              </h1>
              <p className="text-xl text-slate-600">
                Comprehensive assessments and training to ensure your organization meets all regulatory requirements and
                delivers excellence in patient care.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  Start Your Journey
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                Learn More
              </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="flex gap-8 pt-4">
              <StatCounter end={100} label="Organizations Trust Us" suffix="+" />
              <StatCounter end={50000} label="Healthcare Professionals Trained" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-96 md:h-[500px] rounded-xl overflow-hidden bg-slate-200 shadow-xl"
          >
            <Image
              src="/diverse-healthcare-team-professionals-in-hospital.jpg"
              alt="Healthcare professionals in hospital setting"
              fill
              className="object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        variants={containerVariants}
        viewport={{ once: true }}
        className="bg-slate-900 text-white py-20"
      >
        <div className="max-w-6xl mx-auto px-6">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Cherith Training Academy</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Our assessments are designed by healthcare compliance experts to ensure your organization stays ahead of
              regulatory changes.
            </p>
          </motion.div>

          <motion.div variants={containerVariants} className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Expert-Designed",
                description: "Developed by healthcare compliance professionals with decades of experience",
              },
              {
                title: "Comprehensive Coverage",
                description: "Assessments covering all major healthcare regulation frameworks and standards",
              },
              {
                title: "Flexible Learning",
                description: "Multiple assessment levels from foundational to advanced expertise",
              },
              {
                title: "Real-World Application",
                description: "Practical scenarios and case studies applicable to your operations",
              },
              {
                title: "Immediate Feedback",
                description: "Instant results and detailed insights after each assessment",
              },
              {
                title: "Dedicated Support",
                description: "Expert guidance and support throughout your compliance journey",
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="space-y-3 p-6 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors duration-300"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white font-bold">{idx + 1}</span>
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="text-slate-300">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        variants={fadeInVariants}
        viewport={{ once: true }}
        className="bg-blue-600 text-white py-16"
      >
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to Enhance Your Compliance?</h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Join hundreds of healthcare organizations that trust Cherith Training Academy for their regulatory readiness
            programs.
          </p>
          <Link href="/auth/register">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-slate-100 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Your Journey Today
            </Button>
          </Link>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-16 h-16 relative">
                  <Image
                    src="/cherith-logo.png"
                    alt="Cherith Training Academy"
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                </div>
                <span className="font-semibold">Cherith Training Academy</span>
              </div>
              <p className="text-sm">Healthcare Regulation Excellence</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Assessments
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Training
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Analytics
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-sm text-center">
            <p>&copy; 2025 Cherith Training Academy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
