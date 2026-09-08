using UnityEngine;
namespace Milzet.Content {
public static class ProjectionMesh {
 public static Mesh Create(string projection) {
  const int columns=96,rows=48;var vertices=new Vector3[(columns+1)*(rows+1)];var uv=new Vector2[vertices.Length];var indices=new int[columns*rows*6];
  for(int row=0;row<=rows;row++)for(int column=0;column<=columns;column++){
   int i=row*(columns+1)+column;var point=Projection.Anchor((double)column/columns,(double)row/rows,projection,5);vertices[i]=new Vector3((float)point[0],(float)point[1],(float)point[2]);uv[i]=new Vector2((float)column/columns,1-(float)row/rows);
  }
  int index=0;for(int row=0;row<rows;row++)for(int column=0;column<columns;column++){
   int a=row*(columns+1)+column,b=a+1,c=a+columns+1,d=c+1;indices[index++]=a;indices[index++]=b;indices[index++]=c;indices[index++]=b;indices[index++]=d;indices[index++]=c;
  }
  var mesh=new Mesh{name="Mono equirectangular surface"};mesh.vertices=vertices;mesh.uv=uv;mesh.triangles=indices;mesh.RecalculateNormals();mesh.RecalculateBounds();return mesh;
 }
}
}
