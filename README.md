<p align="center">
  <img src="logo.png" width="150" style="border-radius: 15px;">
</p>

# Freight Delay Notification

This project demonstrates a freight delay notification system using Temporal.

### Running locally

- `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
- `npm install` to install dependencies.
- Copy `.env.example` to `.env` and set the required variables.
- `npm run start.watch` to start the Worker.
- In another shell, `npm run workflow` to run the Workflow Client.

### Running tests
- `npm run test`

### Workflow

The following diagram illustrates the workflow for freight delay notifications:

```mermaid
sequenceDiagram
    participant Client
    participant Workflow
    participant GetDelayActivity
    participant GetMessageActivity
    participant SendEmailActivity
    participant User

    Client->>Workflow: Start FreightDelayWorkflow
    Workflow->>GetDelayActivity: Call getDelay()
    alt Failed to get delay
        User->>Workflow: manualDelayOverride
    end
    GetDelayActivity-->>Workflow: Returns delay information
    Workflow->>GetMessageActivity: Call getMessage(delayInfo)
    GetMessageActivity-->>Workflow: Returns notification message
    Workflow->>SendEmailActivity: Call sendEmail(message)
    alt Failed to send email
        User->>Workflow: manualConfirmation
    end
    SendEmailActivity-->>Workflow: Email sent confirmation
    Workflow-->>Client: Workflow completed
```
> Failures from Open AI API, Google Maps API and Resend API is handled gracefully.

## License

This project is licensed under the MIT License.
