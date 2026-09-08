# AGENTS.md

## Project

Petro Card Balance Checker

## Goal

Build a mobile-first web application that allows users to select multiple
Petro-Canada eGift card screenshots from an iPhone.

The application should:

1. Read screenshots locally in the browser.
2. Extract the Petro-Canada card number.
3. Extract the security code.
4. Allow the user to review and correct OCR results.
5. Check card balances through an approved and technically supported method.
6. Display the balance for each card.
7. Identify zero-balance / used cards.
8. Calculate the total remaining balance.

## Privacy

Gift card numbers and security codes are sensitive.

Do not:

- log full card numbers
- send screenshots to third-party services unless explicitly required and approved
- commit card numbers or screenshots to Git
- store security codes permanently
- expose credentials in client-side source code

Prefer local browser processing.

## Frontend

The UI should be designed primarily for iPhone Safari.

Requirements:

- responsive layout
- large touch controls
- support selecting multiple images
- clear OCR progress
- editable extracted card data
- masked card numbers after confirmation
- clear balance states
- accessible UI

## Development Style

Keep components modular.

Suggested modules:

- `js/app.js`
- `js/image-processor.js`
- `js/card-parser.js`
- `js/balance-checker.js`

Do not over-engineer the first version.

## Development Stages

### Stage 1

Basic responsive page and multi-image selection.

### Stage 2

OCR and card-number/security-code extraction.

### Stage 3

Review/edit extracted results.

### Stage 4

Investigate and implement balance checking using a supported method.

### Stage 5

PWA support and improved iPhone experience.

## Git

Do not commit user screenshots, gift-card credentials, secrets, `.env` files,
or generated test data containing real credentials.