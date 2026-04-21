<xsl:stylesheet version="2.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:xs="http://www.w3.org/2001/XMLSchema"
	xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
	xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
  xmlns:sh="http://www.w3.org/ns/shacl#"
  xmlns:skos="http://www.w3.org/2004/02/skos/core#"
  xmlns:lto="http://bp4mc2.org/lto#"
  xmlns:graphml="http://graphml.graphdrawing.org/xmlns"
  xmlns:y="http://www.yworks.com/xml/graphml"
>

<xsl:output indent="yes"/>

<xsl:key name="resource" match="/ROOT/rdf:RDF/rdf:Description" use="@rdf:about|@rdf:nodeID"/>

<xsl:template match="/">
  <graphml:graphml>
    <graphml:key attr.name="Description" attr.type="string" for="graph" id="d0"/>
    <graphml:key for="port" id="d1" yfiles.type="portgraphics"/>
    <graphml:key for="port" id="d2" yfiles.type="portgeometry"/>
    <graphml:key for="port" id="d3" yfiles.type="portuserdata"/>
    <graphml:key attr.name="url" attr.type="string" for="node" id="d4"/>
    <graphml:key attr.name="description" attr.type="string" for="node" id="d5"/>
    <graphml:key for="node" id="d6" yfiles.type="nodegraphics"/>
    <graphml:key for="graphml" id="d7" yfiles.type="resources"/>
    <graphml:key attr.name="url" attr.type="string" for="edge" id="d8"/>
    <graphml:key attr.name="description" attr.type="string" for="edge" id="d9"/>
    <graphml:key for="edge" id="d10" yfiles.type="edgegraphics"/>
    <graphml:graph id="G" edgedefault="directed">
      <xsl:apply-templates select="ROOT/rdf:RDF"/>
    </graphml:graph>
  </graphml:graphml>
</xsl:template>

<xsl:template match="rdf:RDF">
  <xsl:apply-templates select="rdf:Description" mode="node"/>
  <xsl:apply-templates select="rdf:Description" mode="edge"/>
</xsl:template>

<xsl:template match="rdf:Description[rdf:type/@rdf:resource='http://bp4mc2.org/lto#Standaard']" mode="node">
  <xsl:apply-templates select="." mode="node-generic"/>
</xsl:template>

<xsl:template match="rdf:Description[rdf:type/@rdf:resource='http://bp4mc2.org/lto#Standaard']" mode="edge">
  <xsl:apply-templates select="." mode="edge-generic"/>
</xsl:template>

<xsl:template match="rdf:Description[skos:inScheme/@rdf:resource='http://bp4mc2.org/ltt#BegrippenkaderTaken']" mode="node">
  <graphml:node id="{@rdf:about}">
    <graphml:data key="d5"/>
    <graphml:data key="d6">
      <y:ShapeNode>
        <y:Geometry height="71.0" width="108.0" x="330.0" y="334.0"/>
        <y:Fill color="#FFFFCC" transparent="false"/>
        <y:BorderStyle color="#000000" raised="false" type="line" width="1.0"/>
        <y:NodeLabel alignment="center" autoSizePolicy="content" fontFamily="Dialog" fontSize="12" fontStyle="plain" hasBackgroundColor="false" hasLineColor="false" height="18.1328125" horizontalTextPosition="center" iconTextGap="4" modelName="custom" textColor="#000000" verticalTextPosition="bottom" visible="true" width="32.79296875" x="37.603515625" xml:space="preserve" y="26.43359375"><xsl:value-of select="rdfs:label"/><y:LabelModel><y:SmartNodeLabelModel distance="4.0"/></y:LabelModel><y:ModelParameter><y:SmartNodeLabelModelParameter labelRatioX="0.0" labelRatioY="0.0" nodeRatioX="0.0" nodeRatioY="0.0" offsetX="0.0" offsetY="0.0" upX="0.0" upY="-1.0"/></y:ModelParameter></y:NodeLabel>
        <y:Shape type="rectangle"/>
      </y:ShapeNode>
    </graphml:data>
  </graphml:node>
</xsl:template>

<xsl:template match="rdf:Description" mode="node">
  <!-- Ignore all others -->
</xsl:template>

<xsl:template match="rdf:Description" mode="edge">
  <!-- Ignore all others -->
</xsl:template>

<xsl:template match="rdf:Description" mode="node-generic">
  <graphml:node id="{@rdf:about}">
    <graphml:data key="d5"/>
    <graphml:data key="d6">
      <y:ShapeNode>
        <y:Geometry height="71.0" width="108.0" x="330.0" y="334.0"/>
        <y:Fill color="#FFFFCC" transparent="false"/>
        <y:BorderStyle color="#000000" raised="false" type="line" width="1.0"/>
        <y:NodeLabel alignment="center" autoSizePolicy="content" fontFamily="Dialog" fontSize="12" fontStyle="plain" hasBackgroundColor="false" hasLineColor="false" height="18.1328125" horizontalTextPosition="center" iconTextGap="4" modelName="custom" textColor="#000000" verticalTextPosition="bottom" visible="true" width="32.79296875" x="37.603515625" xml:space="preserve" y="26.43359375"><xsl:value-of select="rdfs:label"/><y:LabelModel><y:SmartNodeLabelModel distance="4.0"/></y:LabelModel><y:ModelParameter><y:SmartNodeLabelModelParameter labelRatioX="0.0" labelRatioY="0.0" nodeRatioX="0.0" nodeRatioY="0.0" offsetX="0.0" offsetY="0.0" upX="0.0" upY="-1.0"/></y:ModelParameter></y:NodeLabel>
        <y:Shape type="ellipse"/>
      </y:ShapeNode>
    </graphml:data>
  </graphml:node>
</xsl:template>

<xsl:template match="rdf:Description" mode="edge-generic">
  <xsl:variable name="lt-uri" select="@rdf:about"/>
  <xsl:for-each select="key('resource',lto:geschiktVoorTaak/@rdf:resource)">
    <xsl:variable name="taak-uri"><xsl:value-of select="lto:taaktype/@rdf:resource"/></xsl:variable>
    <xsl:if test="exists(key('resource',$taak-uri))">
      <graphml:edge id="{$lt-uri}-{$taak-uri}" source="{$lt-uri}" target="{$taak-uri}">
        <graphml:data key="d9"/>
        <graphml:data key="d10">
          <y:PolyLineEdge>
            <y:Path sx="0.0" sy="0.0" tx="0.0" ty="0.0"/>
            <y:LineStyle color="#000000" type="line" width="1.0"/>
            <y:Arrows source="none" target="standard"/>
            <y:EdgeLabel alignment="center" backgroundColor="#FFFFFF" configuration="AutoFlippingLabel" distance="2.0" fontFamily="Dialog" fontSize="12" fontStyle="plain" hasLineColor="false" height="18.1328125" horizontalTextPosition="center" iconTextGap="4" modelName="custom" preferredPlacement="anywhere" ratio="0.5" textColor="#000000" verticalTextPosition="bottom" visible="true" width="25.779296875" x="7.043196649858601" xml:space="preserve" y="10.845524609374934"><xsl:value-of select="lto:omschrijving"/><y:LabelModel><y:SmartEdgeLabelModel autoRotationEnabled="false" defaultAngle="0.0" defaultDistance="10.0"/></y:LabelModel><y:ModelParameter><y:SmartEdgeLabelModelParameter angle="0.0" distance="30.0" distanceToCenter="true" position="center" ratio="0.0" segment="0"/></y:ModelParameter><y:PreferredPlacementDescriptor angle="0.0" angleOffsetOnRightSide="0" angleReference="absolute" angleRotationOnRightSide="co" distance="-1.0" frozen="true" placement="anywhere" side="anywhere" sideReference="relative_to_edge_flow"/></y:EdgeLabel>
            <y:BendStyle smoothed="false"/>
          </y:PolyLineEdge>
        </graphml:data>
      </graphml:edge>
    </xsl:if>
  </xsl:for-each>
</xsl:template>

</xsl:stylesheet>
