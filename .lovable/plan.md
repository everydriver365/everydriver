
Update the "Flexible Payments" tile in the "What's Included" section on the Drive365 homepage with the new image showing Klarna/Clearpay payment options on a phone.

**Plan:**
1. Save the uploaded image to the project assets
2. Upload the image to Supabase storage in the `instructor-images` bucket under `included-features/`
3. Update the `included_features` database table to set the new `image_url` for the "Flexible Payments" feature (ID: ad26bd09-53d2-4e3f-ad2f-69c1b291ffa1)

The image shows a learner driver in a car holding a phone displaying "Book a Driving Course" with Klarna and Clearpay payment options, which perfectly represents the flexible payments feature.

**Files to modify:**
- Database: `included_features` table (update image_url for Flexible Payments)
- Storage: Upload new image to `instructor-images/included-features/`
- Project asset: Save copy to `src/assets/` for reference
