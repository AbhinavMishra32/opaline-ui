import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardRow, CardTitle, Switch } from "@opaline/ui"

export default function CardDemo() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Agent permissions</CardTitle>
        <CardDescription>What the agent may do without asking.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <CardRow>
          <span>Read files in the workspace</span>
          <Switch defaultChecked />
        </CardRow>
        <CardRow>
          <span>Run terminal commands</span>
          <Switch />
        </CardRow>
        <CardRow>
          <span>Network access</span>
          <Badge variant="muted">Ask</Badge>
        </CardRow>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="ghost">Reset</Button>
        <Button>Save</Button>
      </CardFooter>
    </Card>
  )
}
