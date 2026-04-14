

## Customise chat widget colors and welcome message per instructor

### What changes
The chat widget will use each instructor's `brand_colour` for its floating button, header bar, and proactive bubble accent. The welcome message will personalise with the instructor's name. When no `brand_colour` is set, the current theme primary color is used as fallback.

### Changes

**`src/components/whatsapp/WhatsAppChatWidget.tsx`**

1. Add `primaryColor?: string` and `welcomeMessage?: string` props to the interface
2. Derive `chatColor` from `primaryColor` prop (fallback to undefined, meaning use CSS `bg-primary`)
3. Apply `chatColor` via inline `style={{ backgroundColor: chatColor }}` on:
   - The floating FAB button (line 710)
   - The chat header bar (line 733)
4. Update the proactive bubble message (line 689) to use `welcomeMessage` prop or default to `👋 Hi! Need help finding the right course? {instructorName} is here to help!`
5. When `primaryColor` is set, apply it as accent on the proactive bubble border-left or top stripe for visual branding

**`src/components/mini-website/MiniWebsiteLayout.tsx`**

1. Pass `primaryColor={instructor.brand_colour}` to the `WhatsAppChatWidget` (line 335)

**`src/components/layout/MainLayout.tsx`**

1. No changes needed — the main layout widget has no instructor context so it keeps default theming

### Summary
Two files edited. The instructor's brand color flows from the mini-website layout into the chat widget, colouring the button, header, and proactive popup. Welcome message auto-personalises with the instructor's name.

