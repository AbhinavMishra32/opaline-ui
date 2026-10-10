import { CircleAlert, Info } from "lucide-react"
import { Alert, AlertAction, AlertDescription, AlertTitle, Button } from "@opaline/ui"

export default function AlertDemo() {
  return (
    <div className="grid w-full max-w-md gap-3">
      <Alert>
        <Info />
        <AlertTitle>A new model is available</AlertTitle>
        <AlertDescription>Threads you start from now on will use it.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <CircleAlert />
        <AlertTitle>The run was interrupted</AlertTitle>
        <AlertDescription>The connection dropped before the last step finished.</AlertDescription>
        <AlertAction>
          <Button size="xs" variant="outline">Retry</Button>
        </AlertAction>
      </Alert>
    </div>
  )
}
