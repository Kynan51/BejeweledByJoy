-- Create the admins table
CREATE TABLE public.admins (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL,
    is_owner boolean DEFAULT false
) WITH (OIDS=FALSE);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create the carts table
CREATE TABLE public.carts (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    FOREIGN KEY (user_id) REFERENCES auth.users (id)
) WITH (OIDS=FALSE);
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

-- Create the products table
CREATE TABLE public.products (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    price numeric NOT NULL,
    discount integer DEFAULT 0,
    image_urls text[] DEFAULT '{}'::text[],
    created_at timestamp without time zone DEFAULT now()
) WITH (OIDS=FALSE);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.products
ADD COLUMN quantity integer NOT NULL DEFAULT 0;

ALTER TABLE public.products
ADD COLUMN sold_count integer NOT NULL DEFAULT 0;

-- Create the cart_items table
CREATE TABLE public.cart_items (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cart_id uuid,
    product_id uuid,
    quantity integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    FOREIGN KEY (cart_id) REFERENCES public.carts (id),
    FOREIGN KEY (product_id) REFERENCES public.products (id)
) WITH (OIDS=FALSE);
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Create the orders table
CREATE TABLE public.orders (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    total_amount numeric NOT NULL,
    status text NOT NULL DEFAULT 'pending'::text,
    shipping_address text NOT NULL,
    phone text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    FOREIGN KEY (user_id) REFERENCES auth.users (id)
) WITH (OIDS=FALSE);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create the order_items table
CREATE TABLE public.order_items (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid,
    product_id uuid,
    product_name text NOT NULL,
    product_price numeric NOT NULL,
    quantity integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    FOREIGN KEY (order_id) REFERENCES public.orders (id),
    FOREIGN KEY (product_id) REFERENCES public.products (id)
) WITH (OIDS=FALSE);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create the saved_addresses table
CREATE TABLE public.saved_addresses (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    name text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    postal_code text NOT NULL,
    country text NOT NULL DEFAULT 'Kenya'::text,
    is_default boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    FOREIGN KEY (user_id) REFERENCES auth.users (id)
) WITH (OIDS=FALSE);
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

-- Create the views table
CREATE TABLE public.views (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    product_id uuid,
    viewed_at timestamp without time zone DEFAULT now(),
    user_agent text,
    FOREIGN KEY (user_id) REFERENCES auth.users (id),
    FOREIGN KEY (product_id) REFERENCES public.products (id)
) WITH (OIDS=FALSE);
ALTER TABLE public.views ENABLE ROW LEVEL SECURITY;

-- Create the wishlists table
CREATE TABLE public.wishlists (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    product_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    FOREIGN KEY (user_id) REFERENCES auth.users (id),
    FOREIGN KEY (product_id) REFERENCES public.products (id)
) WITH (OIDS=FALSE);
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;