
## Fix: Card Logos Not Displaying

**Problem**: The `square-cards-3.jpg` image file exists but appears to be empty or corrupted, so it renders as a broken/invisible image in both the "Pay by Card" tile and the "Secure checkout" footer.

**Solution**:
1. **Re-create the asset** — Write the uploaded card logos image fresh to `src/assets/square-cards-3.jpg` to ensure the file contains valid image data.
2. **Verify both render locations** — The import and `<img>` tags at lines 947-949 (Pay by Card tile) and 1033-1035 (Secure checkout row) are already correct; once the file is valid, both will display.

No code changes needed beyond re-syncing the image asset file. The import path and JSX are already wired up correctly in both locations.
