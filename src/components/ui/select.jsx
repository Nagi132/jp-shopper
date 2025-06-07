"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

/**
 * @component Select
 * @description A customizable select dropdown component that handles selection state
 * @param {string} value - The currently selected value
 * @param {function} onValueChange - Callback function when value changes
 * @param {React.ReactNode} children - SelectTrigger and SelectContent components
 * @param {string} className - Additional CSS classes
 * 
 * @example
 * <Select value={category} onValueChange={setCategory}>
 *   <SelectTrigger>
 *     <SelectValue placeholder="Select category" />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="clothing">Clothing</SelectItem>
 *     <SelectItem value="electronics">Electronics</SelectItem>
 *   </SelectContent>
 * </Select>
 */
const Select = React.forwardRef(({ className, children, value, onValueChange, ...props }, ref) => {
  const [open, setOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value || "")
  const [displayText, setDisplayText] = React.useState("")
  const selectRef = React.useRef(null)

  // Map to store the text for each value
  const valueTextMap = React.useRef(new Map())

  // Update selectedValue when value prop changes
  React.useEffect(() => {
    setSelectedValue(value || "")
  }, [value])

  React.useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Store item texts for lookup
  React.useEffect(() => {
    // Collect all SelectItem components and their values/texts
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child) || child.type !== SelectContent) return;
      
      React.Children.forEach(child.props.children, (item) => {
        if (!React.isValidElement(item) || item.type !== SelectItem) return;
        
        if (item.props.value && item.props.children) {
          valueTextMap.current.set(item.props.value, item.props.children);
          // If this is the currently selected value, update display text
          if (item.props.value === selectedValue) {
            setDisplayText(item.props.children);
          }
        }
      });
    });
  }, [children, selectedValue]);

  const handleSelect = (newValue, text) => {
    setSelectedValue(newValue)
    setDisplayText(text)
    valueTextMap.current.set(newValue, text)
    
    if (onValueChange) {
      onValueChange(newValue)
    }
    setOpen(false)
  }

  return (
    <div className={cn("relative w-full", className)} ref={selectRef} {...props}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return null

        if (child.type === SelectTrigger) {
          return React.cloneElement(child, { 
            onClick: () => setOpen(!open),
            selectedValue,
            displayText
          })
        }

        if (child.type === SelectContent) {
          return open ? React.cloneElement(child, { 
            onSelect: handleSelect,
            selectedValue
          }) : null
        }

        if (child.type === SelectValue) {
          return React.cloneElement(child, {
            displayText,
            selectedValue
          })
        }

        return child
      })}
    </div>
  )
})
Select.displayName = "Select"

/**
 * @component SelectTrigger
 * @description The button that opens the select dropdown
 * @param {React.ReactNode} children - Usually contains SelectValue
 * @param {string} className - Additional CSS classes
 */
const SelectTrigger = React.forwardRef(({ className, children, onClick, selectedValue, displayText, id, ...props }, ref) => {
  return (
    <button
      type="button"
      id={id}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={onClick}
      ref={ref}
      {...props}
    >
      <div className="flex-1 text-left overflow-hidden">
        {React.Children.map(children, child => {
          if (child.type === SelectValue) {
            return React.cloneElement(child, { displayText, selectedValue })
          }
          return child
        })}
      </div>
      <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-1" />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

/**
 * @component SelectValue
 * @description Displays the selected value or placeholder
 * @param {string} placeholder - Text to display when no value is selected
 * @param {string} className - Additional CSS classes
 */
const SelectValue = React.forwardRef(({ className, placeholder, displayText, selectedValue, ...props }, ref) => {  
  return (
    <span className={cn("truncate text-sm block", className)} ref={ref} {...props}>
      {displayText || placeholder}
    </span>
  )
})
SelectValue.displayName = "SelectValue"

/**
 * @component SelectContent
 * @description Container for the dropdown content
 * @param {React.ReactNode} children - SelectItem components
 * @param {string} className - Additional CSS classes
 */
const SelectContent = React.forwardRef(({ className, children, onSelect, selectedValue, ...props }, ref) => {
  return (
    <div
      className={cn(
        "absolute left-0 z-50 w-full rounded-md border border-input bg-background shadow-md mt-1 max-h-60 overflow-auto",
        className
      )}
      ref={ref}
      {...props}
    >
      <div className="p-1">
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return null

          if (child.type === SelectItem) {
            return React.cloneElement(child, { 
              onSelect: () => onSelect(child.props.value, child.props.children),
              isSelected: selectedValue === child.props.value
            })
          }

          return child
        })}
      </div>
    </div>
  )
})
SelectContent.displayName = "SelectContent"

/**
 * @component SelectItem
 * @description Individual selectable item in the dropdown
 * @param {string} value - The value of this item when selected
 * @param {React.ReactNode} children - The display content for this item
 * @param {string} className - Additional CSS classes
 * @param {boolean} disabled - Whether this item is disabled
 * 
 * @example
 * <SelectItem value="clothing">Clothing</SelectItem>
 */
const SelectItem = React.forwardRef(({ className, children, value, onSelect, isSelected, disabled, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        isSelected ? "bg-accent/10 font-medium" : "hover:bg-accent/10",
        disabled ? "opacity-50 cursor-default" : "",
        className
      )}
      onClick={disabled ? undefined : onSelect}
      data-disabled={disabled}
      {...props}
    >
      <span className="flex-grow truncate">{children}</span>
    </div>
  )
})
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } 