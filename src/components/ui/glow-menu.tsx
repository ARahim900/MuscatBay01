import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "../../lib/utils"
import { LucideIcon } from "lucide-react"

interface MenuItem {
  icon: LucideIcon | React.FC
  label: string
  href?: string
  gradient: string
  iconColor: string
  onClick?: () => void
}

interface MenuBarProps extends React.HTMLAttributes<HTMLDivElement> {
  items: MenuItem[]
  activeItem?: string
  onItemClick?: (label: string) => void
}

const itemVariants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
}

const backVariants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
}

const glowVariants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 0.2, type: "spring", stiffness: 400, damping: 30 },
    },
  },
}

const navGlowVariants = {
  initial: { opacity: 0 },
  hover: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1],
    },
  },
}

const sharedTransition = {
  type: "spring" as const,
  stiffness: 150,
  damping: 25,
  duration: 0.2,
}

export const MenuBar = React.forwardRef<HTMLDivElement, MenuBarProps>(
  ({ className, items, activeItem, onItemClick, ...props }, ref) => {
    // Detect if dark mode is active based on document class
    const [isDarkTheme, setIsDarkTheme] = React.useState(false)
    
    React.useEffect(() => {
      const checkTheme = () => {
        setIsDarkTheme(document.documentElement.classList.contains('dark'))
      }
      checkTheme()
      
      // Watch for theme changes
      const observer = new MutationObserver(checkTheme)
      observer.observe(document.documentElement, { 
        attributes: true, 
        attributeFilter: ['class'] 
      })
      
      return () => observer.disconnect()
    }, [])

    return (
      <motion.nav
        ref={ref}
        className={cn(
          "p-1 sm:p-2 rounded-xl sm:rounded-2xl bg-gradient-to-b from-white/80 to-white/40 dark:from-gray-900/80 dark:to-gray-900/40 backdrop-blur-lg border border-gray-200/40 dark:border-gray-700/40 shadow-lg relative overflow-hidden max-w-full",
          className,
        )}
        initial="initial"
        whileHover="hover"
        {...props}
      >
        <motion.div
          className={`absolute -inset-2 bg-gradient-radial from-transparent ${
            isDarkTheme
              ? "via-blue-400/30 via-30% via-purple-400/30 via-60% via-red-400/30 via-90%"
              : "via-blue-400/20 via-30% via-purple-400/20 via-60% via-red-400/20 via-90%"
          } to-transparent rounded-3xl z-0 pointer-events-none`}
          variants={navGlowVariants}
        />
        <ul 
          className="flex items-center gap-1 sm:gap-2 relative z-10 overflow-x-auto" 
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitScrollbar: { display: 'none' }
          }}
        >
          {items.map((item) => {
            const Icon = item.icon
            const isActive = item.label === activeItem

            return (
              <motion.li key={item.label} className="relative flex-shrink-0">
                <button
                  onClick={() => {
                    onItemClick?.(item.label)
                    item.onClick?.()
                  }}
                  className="block w-full"
                >
                  <motion.div
                    className="block rounded-xl overflow-visible group relative"
                    style={{ perspective: "600px" }}
                    whileHover="hover"
                    initial="initial"
                  >
                    <motion.div
                      className="absolute inset-0 z-0 pointer-events-none"
                      variants={glowVariants}
                      animate={isActive ? "hover" : "initial"}
                      style={{
                        background: item.gradient,
                        opacity: isActive ? 1 : 0,
                        borderRadius: "16px",
                        filter: "blur(8px)",
                      }}
                    />
                    <motion.div
                      className={cn(
                        "flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 relative z-10 bg-transparent transition-colors rounded-xl",
                        isActive
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white",
                      )}
                      variants={itemVariants}
                      transition={sharedTransition}
                      style={{
                        transformStyle: "preserve-3d",
                        transformOrigin: "center bottom",
                      }}
                    >
                      <span
                        className={cn(
                          "transition-colors duration-300 flex-shrink-0",
                          isActive ? item.iconColor : "",
                        )}
                      >
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </span>
                      <span className="font-medium text-xs sm:text-sm whitespace-nowrap">{item.label}</span>
                    </motion.div>
                    <motion.div
                      className={cn(
                        "flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 absolute inset-0 z-10 bg-transparent transition-colors rounded-xl",
                        isActive
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white",
                      )}
                      variants={backVariants}
                      transition={sharedTransition}
                      style={{
                        transformStyle: "preserve-3d",
                        transformOrigin: "center top",
                        rotateX: 90,
                      }}
                    >
                      <span
                        className={cn(
                          "transition-colors duration-300 flex-shrink-0",
                          isActive ? item.iconColor : "",
                        )}
                      >
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </span>
                      <span className="font-medium text-xs sm:text-sm whitespace-nowrap">{item.label}</span>
                    </motion.div>
                  </motion.div>
                </button>
              </motion.li>
            )
          })}
        </ul>
      </motion.nav>
    )
  },
)

MenuBar.displayName = "MenuBar"