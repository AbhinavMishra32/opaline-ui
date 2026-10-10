import { Button, Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet, Input, Switch, Textarea } from "@opaline/ui"

export default function FieldDemo() {
  return (
    <form className="w-full max-w-sm" onSubmit={(event) => event.preventDefault()}>
      <FieldSet>
        <FieldLegend>New agent</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="agent-name">Name</FieldLabel>
            <Input id="agent-name" placeholder="Release notes" />
          </Field>
          <Field>
            <FieldLabel htmlFor="agent-prompt">Instructions</FieldLabel>
            <Textarea id="agent-prompt" placeholder="Summarise merged PRs every Friday." />
            <FieldDescription>Plain language works best.</FieldDescription>
          </Field>
          <Field orientation="horizontal">
            <FieldLabel htmlFor="agent-ask">Ask before running commands</FieldLabel>
            <Switch defaultChecked id="agent-ask" />
          </Field>
          <Button type="submit">Create agent</Button>
        </FieldGroup>
      </FieldSet>
    </form>
  )
}
