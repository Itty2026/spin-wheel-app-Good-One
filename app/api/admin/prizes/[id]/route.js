import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

function isAuthorized(request) {
  const passcode = request.headers.get("x-admin-passcode");
  return passcode && passcode === process.env.ADMIN_PASSCODE;
}

export async function PUT(request, context) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = context.params.id;
  const body = await request.json();
  const { name, color, active, sort_order } = body;

  const { data, error } = await supabaseAdmin
    .from("prizes")
    .update({
      name,
      color,
      active,
      sort_order,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request, context) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = context.params.id;

  const { error } = await supabaseAdmin
    .from("prizes")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}