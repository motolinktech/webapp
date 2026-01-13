import { Link } from "@tanstack/react-router";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../ui/breadcrumb";
import { Separator } from "../ui/separator";
import { SidebarTrigger } from "../ui/sidebar";

interface AppContentHeaderProps {
  breadcrumbItems?: { title: string; href?: string }[];
}

export function ContentHeader({
  breadcrumbItems = [],
}: AppContentHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => {
              const isLast = index === breadcrumbItems.length - 1;

              return [
                <BreadcrumbItem
                  key={item.href ?? index}
                  className={isLast ? undefined : "hidden md:block"}
                >
                  {isLast ? (
                    <BreadcrumbPage>{item.title}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={item.href}>
                        {item.title}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>,
                !isLast && (
                  <BreadcrumbSeparator
                    key={`sep-${
                      // biome-ignore lint/suspicious/noArrayIndexKey: Nesse caso o index é suficiente
                      index
                      }`}
                    className="hidden md:block"
                  />
                ),
              ];
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
