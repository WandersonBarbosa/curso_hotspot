import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FinancePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Financeiro</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Fluxo de faturas, PIX e conciliação Atlaz. Use a API `/hotspot-users/:companyId/pix` para gerar cobranças e webhooks em
        `/api/v1/webhooks/pix/:provider`.
      </CardContent>
    </Card>
  );
}
