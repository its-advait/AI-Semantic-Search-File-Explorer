# AI-Powered Auto-Organization Strategy

## 1. Core Philosophy: Plan and Approve

The primary goal of the auto-organization feature is to provide powerful AI assistance without sacrificing user control. A fully autonomous system that reorganizes files without permission is unpredictable and untrustworthy. 

Therefore, the entire workflow is based on a **"Plan and Approve"** model. The AI analyzes the user's files and proposes a comprehensive organization plan, but **no changes are made until the user explicitly approves it.**

## 2. The User Workflow

From the user's perspective, the process is simple and intuitive:

1.  **Trigger:** The user clicks a single "Auto-Organize My Library" button in the dashboard.
2.  **AI Planning:** In the background, the system fetches all unorganized files and generates a complete organization plan. This involves clustering related files and using an LLM to intelligently name the clusters.
3.  **Review:** A modal dialog appears, presenting the AI's proposed plan. The user can see the names of the new "Smart Folders" the AI wants to create and which files will be in them.
4.  **Approve or Cancel:** The user has the final say. They can either approve the entire plan or cancel it.
5.  **Execution:** If approved, the system executes the plan in a single batch operation, creating all the folders and linking the files. The UI then refreshes to show the newly organized library.

## 3. Technical Implementation

The feature is powered by two new Edge Functions and a new UI component.

### Backend: Edge Functions

#### `generate-organization-plan`
This is the core engine of the feature. It is responsible for creating the plan.

-   **Triggered by:** The "Auto-Organize" button in the UI.
-   **Input:** The user's identifier (`user_identifier`).
-   **Process:**
    1.  **Fetch All Unorganized Files:** It calls a database function to get a list of every file for the user that is not currently linked to a `smart_folder`.
    2.  **Iterative Clustering:** It loops through the list of unorganized files:
        -   It picks the first file in the list.
        -   It finds its most semantically similar neighbors *that are also on the unorganized list*.
        -   This group of files becomes a **cluster**.
        -   It removes the files in this new cluster from the main "unorganized" list.
        -   It repeats this process until the unorganized list is empty.
    3.  **Batch LLM Naming:** Once all clusters are identified, it makes a single, powerful call to the LLM. The prompt contains all the clusters and asks the AI to propose a name and description for each one.
-   **Output:** It returns a JSON object representing the complete `OrganizationPlan`.

#### `execute-organization-plan`
This function is responsible for applying the plan to the database.

-   **Triggered by:** The "Approve" button in the UI's plan review modal.
-   **Input:** The `OrganizationPlan` object.
-   **Process:**
    1.  It iterates through each proposed folder in the plan.
    2.  For each one, it calls the existing `create_smart_folder_and_link_files` database function, passing the name, description, and list of file IDs.
-   **Output:** A success or error message.

### Frontend: UI Component

#### `OrganizationPlanModal.tsx`
This new component is responsible for displaying the plan to the user.

-   **Props:** It receives the `OrganizationPlan` object as a prop.
-   **Renders:**
    -   A clear summary of the plan (e.g., "LibrAIry suggests creating 8 new Smart Folders").
    -   A list of the proposed folders, with their names, descriptions, and a count of the files they will contain.
    -   An "Approve Plan" button that triggers the `execute-organization-plan` function.
    -   A "Cancel" button to close the modal and make no changes.
