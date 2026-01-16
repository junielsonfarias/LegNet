'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProposicoesPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Proposições</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Página de proposições - versão simplificada para teste</p>
        </CardContent>
      </Card>
    </div>
  )
}

