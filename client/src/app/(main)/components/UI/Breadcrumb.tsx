import Link from 'next/link'

export interface BreadcrumbItem {
    label: string
    href?: string
}

const Breadcrumb = ({ items }: { items: BreadcrumbItem[] }) => {
    return (
        <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 flex-wrap text-sm">
                {items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                        {item.href ? (
                            <Link href={item.href} className="text-text hover:text-secondary transition-colors">
                                {item.label}
                            </Link>
                        ) : (
                            <span className="text-text-hover font-medium line-clamp-1">{item.label}</span>
                        )}
                        {i < items.length - 1 && <span className="text-primary-hover">/</span>}
                    </li>
                ))}
            </ol>
        </nav>
    )
}

export default Breadcrumb
