import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CodeFile {
  id: string;
  name: string;
  language: string;
  content: string;
  createdAt: Date;
}

const LANGUAGES = ['Python', 'JavaScript', 'Java', 'C++', 'Go', 'TypeScript', 'Rust'];
const API_URL = 'https://functions.poehali.dev/ee865d9a-6dc9-47d4-b082-1fab25c10f60';

export default function Index() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Привет! Я помогу вам работать с кодом. Опишите задачу или загрузите файл.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentCode, setCurrentCode] = useState(`def hello_world():
    print("Hello, World!")
    return True

if __name__ == "__main__":
    hello_world()`);
  const [selectedLanguage, setSelectedLanguage] = useState('Python');
  const [files, setFiles] = useState<CodeFile[]>([
    {
      id: '1',
      name: 'example.py',
      language: 'Python',
      content: 'def hello():\n    print("Hello")',
      createdAt: new Date()
    },
    {
      id: '2',
      name: 'app.js',
      language: 'JavaScript',
      content: 'const app = () => {\n  console.log("App");\n}',
      createdAt: new Date()
    }
  ]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages([...messages, newMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: newMessage.content,
          history: history
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка API');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось отправить запрос',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-sidebar-foreground flex items-center gap-2">
            <Icon name="Folder" size={20} />
            Архив проектов
          </h2>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {files.map((file) => (
              <button
                key={file.id}
                onClick={() => {
                  setCurrentCode(file.content);
                  setSelectedLanguage(file.language);
                }}
                className="w-full p-3 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors text-left"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="FileCode" size={16} className="text-sidebar-primary" />
                  <span className="text-sm font-medium text-sidebar-foreground">{file.name}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {file.language}
                </Badge>
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-border">
          <Button className="w-full" variant="outline">
            <Icon name="Upload" size={16} className="mr-2" />
            Загрузить код
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-14 border-b border-border px-6 flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <Icon name="Code2" size={24} className="text-primary" />
            <h1 className="text-xl font-bold">Code IDE</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Icon name="Settings" size={18} />
            </Button>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-hidden">
          <div className="h-full bg-card rounded-lg border border-border overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-background border border-border rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
                <Badge variant="secondary" className="font-mono text-xs">
                  {currentCode.split('\n').length} строк
                </Badge>
              </div>
              
              <Button size="sm" variant="ghost">
                <Icon name="Copy" size={16} className="mr-2" />
                Копировать
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              <pre className="text-sm font-mono leading-relaxed">
                {currentCode.split('\n').map((line, i) => (
                  <div key={i} className="flex">
                    <span className="text-muted-foreground select-none w-12 text-right pr-4">
                      {i + 1}
                    </span>
                    <span className="text-card-foreground">{line}</span>
                  </div>
                ))}
              </pre>
            </ScrollArea>
          </div>
        </div>
      </main>

      <aside className="w-96 border-l border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Icon name="MessageSquare" size={20} className="text-primary" />
            Чат с Claude
          </h2>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        <div className="p-4 space-y-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Опишите задачу или запрос..."
            className="min-h-[80px] resize-none bg-background"
          />
          <Button onClick={handleSendMessage} className="w-full" disabled={isLoading}>
            <Icon name="Send" size={16} className="mr-2" />
            {isLoading ? 'Отправка...' : 'Отправить'}
          </Button>
        </div>
      </aside>
    </div>
  );
}