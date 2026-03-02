import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "dropdown",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}) {

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: "w-fit",
        months: "flex gap-4 flex-col sm:flex-row relative",
        month: "flex flex-col w-full gap-2",
        nav: "flex items-center justify-between w-full",
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        month_caption: "flex items-center justify-center flex-1",
        dropdowns: "flex items-center justify-center gap-2",
        dropdown_root: "relative",
        dropdown: "appearance-none bg-transparent border border-input rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer",
        caption_label: "hidden",
        vhidden: "hidden",
        table: "w-full border-collapse mt-4",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        week_number_header: "w-9",
        week_number: "text-[0.8rem] text-muted-foreground",
        day: "relative h-9 w-9 p-0 text-center text-sm",
        range_start: "rounded-l-md bg-accent",
        range_middle: "rounded-none",
        range_end: "rounded-r-md bg-accent",
        today: "bg-accent text-accent-foreground rounded-md",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex h-9 w-9 items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}) {
  const ref = React.useRef(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      className={cn(
        "h-9 w-9 p-0 font-normal",
        modifiers.selected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        modifiers.today && !modifiers.selected && "bg-accent text-accent-foreground",
        modifiers.disabled && "text-muted-foreground opacity-50",
        modifiers.outside && "text-muted-foreground opacity-50",
        className
      )}
      disabled={modifiers.disabled}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
