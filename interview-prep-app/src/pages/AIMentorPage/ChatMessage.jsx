import { Bot, User } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useEffect, useState } from 'react'

export default function ChatMessage({ message ,skipAnimation}) {
  const isUser = message.role === 'user'
  // we need to print message content 
  
  const [count,setCount] = useState(0)
  const [displayedText, setDisplayedText] = useState("")
  const [messages, setMessages] = useState([])
  useEffect(  ()=>{
    setDisplayedText(
    message.content.slice(0,count)
    
  ) 
  if (count < message.content.length){
 const timer =  setTimeout(() => {
    
      setCount(prev => prev+1)
    
    
  }, 10)
  return () =>clearTimeout(timer)
  }
},[count,message.content])

useEffect(()=>{
setCount(0)
setDisplayedText('')
},[message.content])
 
  
  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted',
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </span>

      <div className={cn('max-w-[80%] space-y-1', isUser && 'text-right')}>
        <div
          className={cn(
            'inline-block rounded-xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card text-foreground',
          )}>
            {isUser ? message.content : displayedText}
          </div>
      
          
          
        
        <p className="text-xs text-muted-foreground">{message.timestamp}</p>
      </div>
    </div>
  )
}
