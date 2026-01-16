import Link from 'next/link'
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Youtube } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Seção principal do footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Informações da Câmara */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-camara-primary">
              Câmara Municipal de Mojuí dos Campos
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 mt-0.5 text-camara-primary" />
                <span>
                  Rua Deputado José Macêdo, S/Nº - Centro<br />
                  68.129-000 - Mojuí dos Campos/PA
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-camara-primary" />
                <span>(93) 9.9138-8426</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-camara-primary" />
                <span>camaramojui@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-camara-primary" />
                <span>De 08:00h às 14:00h, Segunda à Sexta</span>
              </div>
            </div>
          </div>

          {/* Links Institucionais */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Institucional</h4>
            <div className="space-y-2 text-sm">
              <Link href="/institucional/sobre" className="block hover:text-camara-primary transition-colors">
                Sobre a Câmara
              </Link>
              <Link href="/institucional/codigo-etica" className="block hover:text-camara-primary transition-colors">
                Código de Ética
              </Link>
              <Link href="/institucional/lei-organica" className="block hover:text-camara-primary transition-colors">
                Lei Orgânica
              </Link>
              <Link href="/institucional/regimento" className="block hover:text-camara-primary transition-colors">
                Regimento Interno
              </Link>
              <Link href="/institucional/ouvidoria" className="block hover:text-camara-primary transition-colors">
                Ouvidoria
              </Link>
            </div>
          </div>

          {/* Links Legislativos */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Legislativo</h4>
            <div className="space-y-2 text-sm">
              <Link href="/parlamentares" className="block hover:text-camara-primary transition-colors">
                Vereadores
              </Link>
              <Link href="/legislativo/sessoes" className="block hover:text-camara-primary transition-colors">
                Sessões
              </Link>
              <Link href="/legislativo/proposicoes" className="block hover:text-camara-primary transition-colors">
                Proposições
              </Link>
              <Link href="/legislativo/comissoes" className="block hover:text-camara-primary transition-colors">
                Comissões
              </Link>
              <Link href="/transparencia/publicacoes" className="block hover:text-camara-primary transition-colors">
                Publicações
              </Link>
            </div>
          </div>

          {/* Transparência e Contato */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Transparência</h4>
            <div className="space-y-2 text-sm">
              <Link href="/transparencia/gestao-fiscal" className="block hover:text-camara-primary transition-colors">
                Gestão Fiscal
              </Link>
              <Link href="/transparencia/leis" className="block hover:text-camara-primary transition-colors">
                Leis
              </Link>
              <Link href="/transparencia/decretos" className="block hover:text-camara-primary transition-colors">
                Decretos
              </Link>
            </div>
            
            {/* Redes Sociais */}
            <div className="pt-4">
              <h5 className="text-sm font-semibold mb-2">Redes Sociais</h5>
              <div className="flex space-x-3">
                <Link href="#" className="text-gray-400 hover:text-camara-primary transition-colors">
                  <Facebook className="h-5 w-5" />
                </Link>
                <Link href="#" className="text-gray-400 hover:text-camara-primary transition-colors">
                  <Instagram className="h-5 w-5" />
                </Link>
                <Link href="#" className="text-gray-400 hover:text-camara-primary transition-colors">
                  <Youtube className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informações da Legislatura */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-400">
                <strong>Legislatura 2025/2028</strong> | Presidente: Pantoja do Cartório
              </p>
              <p className="text-sm text-gray-400">
                CNPJ: 17.434.855/0001-23
              </p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-400">
                © 2025 Câmara Municipal de Mojuí dos Campos. Todos os direitos reservados.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Desenvolvido para fins educacionais e de transparência pública
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Radar ATRICON */}
      <div className="bg-camara-primary py-2">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-white">
            <strong>Radar ATRICON</strong> - Câmara Municipal de Mojuí dos Campos
          </p>
        </div>
      </div>
    </footer>
  )
}
